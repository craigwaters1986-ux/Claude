"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationKeys, projectKeys, snagKeys } from "@/lib/query-keys";
import {
  addSnagPhotos,
  createSnag,
  deleteSnag,
  deleteSnagPhoto,
  getSnag,
  listSnags,
  updateSnag,
} from "@/lib/services/snags";
import { setCaptureProgress } from "@/lib/capture-progress";
import { compressImage } from "@/lib/image/compress";
import { ServiceError } from "@/lib/services/errors";
import {
  buildImagePath,
  getPublicImageUrl,
  removeImages,
  uploadImage,
} from "@/lib/services/storage";
import type { ListedSnag, SnagPatch, SnagPhoto, SnagPhotoInput, SnagStatus } from "@/types/models";
import type { TypedSupabaseClient } from "@/lib/supabase/client";
import { uuid } from "@/lib/uuid";
import { useSupabase } from "./use-supabase";

export function useSnags(projectId: string | undefined) {
  const supabase = useSupabase();
  return useQuery<ListedSnag[]>({
    queryKey: snagKeys.list(projectId ?? ""),
    queryFn: () => listSnags(supabase, projectId!),
    enabled: !!projectId,
  });
}

/** A photo picked on the device, not yet uploaded. */
export type CapturePhoto = {
  /** Client-generated; also names the file in Storage, so retries overwrite it. */
  id: string;
  /** Original image. Dropped (set to null) once saved, to free memory. */
  file: File | null;
  /** Object URL of `file`, shown until the upload finishes. */
  previewUrl: string;
};

/** What the Rapid Entry form hands over for each snag. */
export type SnagCapture = {
  /** Client-generated, so the optimistic row, the photo paths and the DB row all share it. */
  id: string;
  title: string;
  assigned_to?: string | null;
  /** Comments (stored in the `description` column). */
  description?: string | null;
  status?: SnagStatus;
  photos: CapturePhoto[];
  /** Where it is: level, and the spot on that level's drawing if pinned. */
  level_id?: string | null;
  pin_x?: number | null;
  pin_y?: number | null;
};

// Work already done per photo, so an automatic retry after a dropped
// connection doesn't compress or upload the same photo again.
const compressedPhotos = new Map<string, Blob>(); // photo id → compressed image
const uploadedPhotos = new Map<string, string>(); // photo id → storage path

/**
 * Compress and upload photos one by one, reporting progress under
 * `progressKey`. Returns rows ready to attach to the snag, numbered from
 * `startPosition`. Safe to call again after a failure: finished photos are skipped.
 */
async function uploadPhotos(
  supabase: TypedSupabaseClient,
  projectId: string,
  snagId: string,
  photos: CapturePhoto[],
  progressKey: string,
  startPosition = 0,
): Promise<SnagPhotoInput[]> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new ServiceError("Your session has expired. Please sign in again.", "no_session");
  const userId = data.session.user.id;

  const rows: SnagPhotoInput[] = [];
  for (const [i, photo] of photos.entries()) {
    const counter = { photo: i + 1, photos: photos.length };
    let path = uploadedPhotos.get(photo.id);
    if (!path) {
      let blob = compressedPhotos.get(photo.id);
      if (!blob) {
        if (!photo.file) throw new ServiceError("This photo is no longer available. Please add it again.");
        setCaptureProgress(progressKey, { stage: "compressing", ...counter });
        blob = await compressImage(photo.file);
        compressedPhotos.set(photo.id, blob);
      }
      // {userId}/{projectId}/{snagId}/{photoId}.jpg
      path = buildImagePath(userId, projectId, `${snagId}/${photo.id}`, blob.type);
      setCaptureProgress(progressKey, { stage: "uploading", fraction: 0, ...counter });
      await uploadImage(supabase, path, blob, (fraction) =>
        setCaptureProgress(progressKey, { stage: "uploading", fraction, ...counter }),
      );
      uploadedPhotos.set(photo.id, path);
    }
    rows.push({ id: photo.id, position: startPosition + i, image_path: path, image_url: getPublicImageUrl(supabase, path) });
  }
  return rows;
}

/** Forget cached work for photos that were saved or discarded, and free their memory. */
function releasePhotos(photos: CapturePhoto[], { revokeNow = false } = {}) {
  for (const photo of photos) {
    compressedPhotos.delete(photo.id);
    uploadedPhotos.delete(photo.id);
    photo.file = null; // the mutation cache keeps the variables; drop the big original
    // Free the local preview once the real image has had time to load.
    if (revokeNow) URL.revokeObjectURL(photo.previewUrl);
    else setTimeout(() => URL.revokeObjectURL(photo.previewUrl), 30_000);
  }
}

/** A photo shown before it's saved: a local preview, no storage path yet. */
function previewPhoto(snagId: string, photo: CapturePhoto, position: number): SnagPhoto {
  return { id: photo.id, snag_id: snagId, position, image_url: photo.previewUrl, image_path: "", created_at: new Date().toISOString() };
}

/**
 * Capture a snag in the background: compress photos → upload → insert row.
 * This is the engine of Rapid Entry.
 *
 * - The snag appears in the project list immediately (marked `_pending`, with
 *   local previews), so the form can reset straight away.
 * - Captures run one at a time, in the order they were logged (a shared
 *   mutation `scope`), so snag numbers follow the walk-round: #1 is the first
 *   defect logged, even if a later one without photos would save sooner. On
 *   a weak site connection this costs nothing, because parallel uploads would
 *   only split the same bandwidth.
 * - The whole pipeline is one mutation, so it keeps running if the user leaves
 *   the page, retries with backoff on bad signal, and pauses while offline.
 * - Each step is idempotent (client ids + fixed photo paths), so retries are safe.
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
      const photos = await uploadPhotos(supabase, projectId, input.id, input.photos, input.id);
      setCaptureProgress(input.id, { stage: "saving" });
      return createSnag(
        supabase,
        {
          id: input.id,
          project_id: projectId,
          title: input.title,
          description: input.description ?? null,
          assigned_to: input.assigned_to ?? null,
          status: input.status ?? "open",
          level_id: input.level_id ?? null,
          pin_x: input.level_id ? (input.pin_x ?? null) : null,
          pin_y: input.level_id ? (input.pin_y ?? null) : null,
        },
        photos,
      );
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
        location_details: null,
        level_id: input.level_id ?? null,
        pin_x: input.pin_x ?? null,
        pin_y: input.pin_y ?? null,
        assigned_to: input.assigned_to ?? null,
        status: input.status ?? "open",
        image_url: input.photos[0]?.previewUrl ?? null,
        image_path: null,
        created_by: null,
        created_at: now,
        updated_at: now,
        resolved_at: null,
        photos: input.photos.map((p, i) => previewPhoto(input.id, p, i)),
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
      releasePhotos(input.photos);
    },

    onError: (_err, input) => {
      // Reached only after automatic retries are used up. The Rapid Entry list
      // keeps the failed item (with its photos) so the user can retry or discard.
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
 * Throw away a capture that failed: forget cached work and delete any of its
 * photos that already reached storage.
 */
export async function discardCapture(supabase: ReturnType<typeof useSupabase>, capture: SnagCapture) {
  const paths = capture.photos.map((p) => uploadedPhotos.get(p.id)).filter((p): p is string => !!p);
  releasePhotos(capture.photos, { revokeNow: true });
  if (paths.length) await removeImages(supabase, paths);
}

/** Progress key for photos being added to an existing snag. */
export const addPhotosProgressKey = (snagId: string) => `add-photos:${snagId}`;

/**
 * Add photos to an existing snag. They show straight away (local previews)
 * and upload in the background; they're removed again if the upload fails.
 */
export function useAddSnagPhotos(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const listKey = snagKeys.list(projectId);

  return useMutation({
    mutationKey: ["add-snag-photos", projectId],
    mutationFn: async ({ snagId, photos, startPosition }: { snagId: string; photos: CapturePhoto[]; startPosition: number }) => {
      const rows = await uploadPhotos(supabase, projectId, snagId, photos, addPhotosProgressKey(snagId), startPosition);
      setCaptureProgress(addPhotosProgressKey(snagId), { stage: "saving" });
      // A photo saved by an older app version lives only on the snag row. Give
      // it a proper photo row first, or the new photos would replace it as cover
      // and it would drop out of the list.
      const current = await getSnag(supabase, snagId);
      const legacy = current.photos.find((p) => p.id.startsWith("legacy-"));
      const adopted: SnagPhotoInput[] = legacy
        ? [{ id: uuid(), position: 0, image_url: legacy.image_url, image_path: legacy.image_path || legacy.image_url }]
        : [];
      await addSnagPhotos(supabase, snagId, [...adopted, ...rows]);
      return getSnag(supabase, snagId);
    },

    onMutate: async ({ snagId, photos, startPosition }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ListedSnag[]>(listKey);
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.map((s) =>
          s.id === snagId
            ? { ...s, photos: [...s.photos, ...photos.map((p, i) => previewPhoto(snagId, p, startPosition + i))] }
            : s,
        ),
      );
      return { previous };
    },

    onSuccess: (saved, { photos }) => {
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) => old.map((s) => (s.id === saved.id ? saved : s)));
      releasePhotos(photos);
    },

    onError: async (_err, { photos }, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
      await discardCapture(supabase, { id: "", title: "", photos });
    },

    onSettled: (_data, _err, { snagId }) => setCaptureProgress(addPhotosProgressKey(snagId), null),
  });
}

/** Remove one photo from a snag (and its file from storage). Optimistic. */
export function useDeleteSnagPhoto(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const listKey = snagKeys.list(projectId);

  return useMutation({
    mutationFn: async (photo: SnagPhoto) => {
      const path = await deleteSnagPhoto(supabase, photo);
      await removeImages(supabase, [path]);
      return getSnag(supabase, photo.snag_id);
    },

    onMutate: async (photo) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ListedSnag[]>(listKey);
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.map((s) => (s.id === photo.snag_id ? { ...s, photos: s.photos.filter((p) => p.id !== photo.id) } : s)),
      );
      return { previous };
    },

    onError: (_err, _photo, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },

    onSuccess: (saved) => {
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) => old.map((s) => (s.id === saved.id ? saved : s)));
    },
  });
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
      const imagePaths = await deleteSnag(supabase, snagId);
      await removeImages(supabase, imagePaths);
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
