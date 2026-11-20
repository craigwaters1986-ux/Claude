"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectKeys, snagKeys } from "@/lib/query-keys";
import {
  addSnagPhotos,
  deleteSnag,
  deleteSnagPhoto,
  getSnag,
  listSnags,
  replaceSnagPhotoFile,
  updateSnag,
} from "@/lib/services/snags";
import { setCaptureProgress } from "@/lib/capture-progress";
import { addToOutbox } from "@/lib/offline/outbox";
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

/** Signed-in user id, remembered on the device so snags can be saved with no signal. */
const LAST_USER_KEY = "snaglist.last-user-id";
export function rememberUserId(id: string | null | undefined) {
  try {
    if (id) localStorage.setItem(LAST_USER_KEY, id);
  } catch {
    // ignore
  }
}
function lastUserId(): string | null {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

/**
 * Save a snag from Rapid Entry. This is the engine of the walk-round.
 *
 * The snag and its photos are written to the outbox on this device first
 * (instant, needs no signal), then uploaded in the background whenever there's
 * signal. See `src/lib/offline/outbox.ts`. Nothing is lost if the signal drops,
 * the page reloads or the phone restarts.
 */
export function useCreateSnag(projectId: string) {
  const supabase = useSupabase();
  return {
    async save(input: SnagCapture) {
      // With no signal an expired session can't refresh, so fall back to the
      // user id remembered on this device. The upload itself still needs a
      // valid sign-in, which it gets once the signal is back.
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const userId = data.session?.user.id ?? lastUserId();
      if (!userId) throw new ServiceError("Please sign in again to save issues.", "no_session");
      await addToOutbox({
        id: input.id,
        userId,
        projectId,
        title: input.title,
        assigned_to: input.assigned_to ?? null,
        description: input.description ?? null,
        status: input.status ?? "open",
        level_id: input.level_id ?? null,
        pin_x: input.level_id ? (input.pin_x ?? null) : null,
        pin_y: input.level_id ? (input.pin_y ?? null) : null,
        photos: input.photos.filter((p) => p.file).map((p) => ({ id: p.id, blob: p.file!, compressed: false })),
      });
      // The outbox keeps its own copy of each photo; the form's previews can go.
      for (const p of input.photos) URL.revokeObjectURL(p.previewUrl);
    },
  };
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

/**
 * Swap a saved photo for a marked-up copy. The new file is uploaded under a
 * new name, the photo row points at it, then the old file is removed. Shows
 * the new photo straight away; puts the old one back if anything fails.
 * Needs signal (unlike capturing new snags).
 */
export function useReplaceSnagPhoto(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const listKey = snagKeys.list(projectId);

  return useMutation({
    mutationFn: async ({ photo, blob }: { photo: SnagPhoto; blob: Blob; previewUrl: string }) => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new ServiceError("Your session has expired. Please sign in again.", "no_session");
      const progressKey = addPhotosProgressKey(photo.snag_id);
      setCaptureProgress(progressKey, { stage: "uploading", fraction: 0, photo: 1, photos: 1 });
      const path = buildImagePath(data.session.user.id, projectId, `${photo.snag_id}/${uuid()}`, blob.type);
      await uploadImage(supabase, path, blob, (fraction) =>
        setCaptureProgress(progressKey, { stage: "uploading", fraction, photo: 1, photos: 1 }),
      );
      setCaptureProgress(progressKey, { stage: "saving" });
      try {
        const old = await replaceSnagPhotoFile(supabase, photo, { image_path: path, image_url: getPublicImageUrl(supabase, path) });
        await removeImages(supabase, [old]);
      } catch (err) {
        await removeImages(supabase, [path]); // don't leave the unused copy behind
        throw err;
      }
      return getSnag(supabase, photo.snag_id);
    },

    onMutate: async ({ photo, previewUrl }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ListedSnag[]>(listKey);
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.map((s) =>
          s.id === photo.snag_id
            ? { ...s, photos: s.photos.map((p) => (p.id === photo.id ? { ...p, image_url: previewUrl, image_path: "" } : p)) }
            : s,
        ),
      );
      return { previous };
    },

    onSuccess: (saved) => {
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) => old.map((s) => (s.id === saved.id ? saved : s)));
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },

    onSettled: (_data, _err, { photo, previewUrl }) => {
      setCaptureProgress(addPhotosProgressKey(photo.snag_id), null);
      // Keep the local preview a moment so the swap to the uploaded copy doesn't flash.
      setTimeout(() => URL.revokeObjectURL(previewUrl), 10_000);
    },
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
      // The database closes up the numbering after a delete; show that straight away.
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) => {
        const gone = old.find((s) => s.id === snagId);
        return old
          .filter((s) => s.id !== snagId)
          .map((s) => (gone && gone.snag_number > 0 && s.snag_number > gone.snag_number ? { ...s, snag_number: s.snag_number - 1 } : s));
      });
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
