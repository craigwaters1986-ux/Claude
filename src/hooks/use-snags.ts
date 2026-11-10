"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationKeys, projectKeys, snagKeys } from "@/lib/query-keys";
import { createSnag, deleteSnag, listSnags, updateSnag } from "@/lib/services/snags";
import { setCaptureProgress } from "@/lib/capture-progress";
import { compressImage } from "@/lib/image/compress";
import { ServiceError } from "@/lib/services/errors";
import {
  buildImagePath,
  getPublicImageUrl,
  removeImages,
  uploadImage,
} from "@/lib/services/storage";
import type { ListedSnag, SnagPatch, SnagStatus } from "@/types/models";
import { useSupabase } from "./use-supabase";

export function useSnags(projectId: string | undefined) {
  const supabase = useSupabase();
  return useQuery<ListedSnag[]>({
    queryKey: snagKeys.list(projectId ?? ""),
    queryFn: () => listSnags(supabase, projectId!),
    enabled: !!projectId,
  });
}

/** What the Rapid Entry form hands over for each snag. */
export type SnagCapture = {
  /** Client-generated, so the optimistic row, the photo path and the DB row all share it. */
  id: string;
  title: string;
  description?: string | null;
  location_details?: string | null;
  status?: SnagStatus;
  /** Original photo from the camera / gallery. */
  photo?: File | null;
  /** Object URL of `photo`, shown until the upload finishes. */
  previewUrl?: string | null;
};

// Work already done for a snag, so an automatic retry after a dropped
// connection doesn't compress or upload the same photo again.
const compressedPhotos = new Map<string, Blob>();
const uploadedPhotos = new Map<string, string>(); // snag id → storage path

/**
 * Capture a snag in the background: compress photo → upload → insert row.
 * This is the engine of Rapid Entry.
 *
 * - The snag appears in the project list immediately (marked `_pending`, with
 *   a local preview), so the form can reset straight away.
 * - Captures run one at a time, in the order they were logged (a shared
 *   mutation `scope`), so snag numbers follow the walk-round: #1 is the first
 *   defect logged, even if a later one without a photo would save sooner. On
 *   a weak site connection this costs nothing, because parallel uploads would
 *   only split the same bandwidth.
 * - The whole pipeline is one mutation, so it keeps running if the user leaves
 *   the page, retries with backoff on bad signal, and pauses while offline.
 * - Each step is idempotent (fixed photo path + client id), so retries are safe.
 */
export function useCreateSnag(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const listKey = snagKeys.list(projectId);
  const createKey = mutationKeys.createSnag(projectId);

  return useMutation({
    mutationKey: createKey,
    scope: { id: createKey.join(":") },
    // Keep finished captures around long enough for the "Logged this visit" list.
    gcTime: 30 * 60_000,

    mutationFn: async (input: SnagCapture) => {
      let image_path: string | null = null;
      let image_url: string | null = null;

      if (input.photo) {
        image_path = uploadedPhotos.get(input.id) ?? null;
        if (!image_path) {
          let blob = compressedPhotos.get(input.id);
          if (!blob) {
            setCaptureProgress(input.id, { stage: "compressing" });
            blob = await compressImage(input.photo);
            compressedPhotos.set(input.id, blob);
          }

          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new ServiceError("Your session has expired. Please sign in again.", "no_session");
          const path = buildImagePath(data.session.user.id, projectId, input.id, blob.type);

          setCaptureProgress(input.id, { stage: "uploading", fraction: 0 });
          await uploadImage(supabase, path, blob, (fraction) =>
            setCaptureProgress(input.id, { stage: "uploading", fraction }),
          );
          uploadedPhotos.set(input.id, path);
          image_path = path;
        }
        image_url = getPublicImageUrl(supabase, image_path);
      }

      setCaptureProgress(input.id, { stage: "saving" });
      return createSnag(supabase, {
        id: input.id,
        project_id: projectId,
        title: input.title,
        description: input.description ?? null,
        location_details: input.location_details ?? null,
        status: input.status ?? "open",
        image_path,
        image_url,
      });
    },

    onMutate: async (input) => {
      // Stop an in-flight refetch from overwriting the optimistic row.
      await queryClient.cancelQueries({ queryKey: listKey });
      const now = new Date().toISOString();
      const optimistic: ListedSnag = {
        id: input.id,
        project_id: projectId,
        snag_number: 0, // the real number comes back from the database
        title: input.title,
        description: input.description ?? null,
        location_details: input.location_details ?? null,
        status: input.status ?? "open",
        image_url: input.previewUrl ?? null,
        image_path: null,
        created_by: null,
        created_at: now,
        updated_at: now,
        resolved_at: null,
        _pending: true,
      };
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) => [
        ...old.filter((s) => s.id !== input.id), // a manual retry replaces its own row
        optimistic,
      ]);
    },

    onSuccess: (saved, input) => {
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.map((s) => (s.id === saved.id ? saved : s)),
      );
      compressedPhotos.delete(input.id);
      uploadedPhotos.delete(input.id);
      // The mutation cache keeps `input` for the visit list; drop the original
      // photo (up to ~12 MB) so a long walk-round doesn't fill the phone's memory.
      input.photo = null;
      // Free the local preview once the real image has had time to load.
      if (input.previewUrl) setTimeout(() => URL.revokeObjectURL(input.previewUrl!), 30_000);
    },

    onError: (_err, input) => {
      // Reached only after automatic retries are used up. The Rapid Entry list
      // keeps the failed item (with its photo) so the user can retry or discard.
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.filter((s) => s.id !== input.id),
      );
    },

    onSettled: (_data, _err, input) => {
      setCaptureProgress(input.id, null);
      // Refetch once the last queued snag has finished, not after every one.
      // Refetching mid-burst would make the list flicker.
      if (queryClient.isMutating({ mutationKey: createKey }) === 1) {
        queryClient.invalidateQueries({ queryKey: listKey });
        queryClient.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
  });
}

/**
 * Throw away a capture that failed: forget cached work and delete its photo
 * if it reached storage.
 */
export async function discardCapture(supabase: ReturnType<typeof useSupabase>, snagId: string) {
  compressedPhotos.delete(snagId);
  const path = uploadedPhotos.get(snagId);
  uploadedPhotos.delete(snagId);
  if (path) await removeImages(supabase, [path]);
}

/** Update a snag (e.g. tap to change status). Optimistic, rolls back on error. */
export function useUpdateSnag(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const listKey = snagKeys.list(projectId);

  return useMutation({
    mutationFn: ({ snagId, patch }: { snagId: string; patch: SnagPatch }) =>
      updateSnag(supabase, snagId, patch),

    onMutate: async ({ snagId, patch }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ListedSnag[]>(listKey);
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.map((s) => (s.id === snagId ? { ...s, ...patch } : s)),
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },

    onSuccess: (saved) => {
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.map((s) => (s.id === saved.id ? saved : s)),
      );
    },

    onSettled: () => {
      // Status changes affect the open/resolved counts.
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteSnag(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const listKey = snagKeys.list(projectId);

  return useMutation({
    mutationFn: async (snagId: string) => {
      const imagePath = await deleteSnag(supabase, snagId);
      if (imagePath) await removeImages(supabase, [imagePath]);
    },

    onMutate: async (snagId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ListedSnag[]>(listKey);
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.filter((s) => s.id !== snagId),
      );
      return { previous };
    },

    onError: (_err, _snagId, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
