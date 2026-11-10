import type { TypedSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { ServiceError } from "./errors";

export const SNAG_IMAGES_BUCKET = "snag-images";

/**
 * Storage path for a snag photo: {userId}/{projectId}/{snagId}.jpg
 * The first folder must be the user's id (enforced by storage RLS).
 * Using the snag id makes retries overwrite the same file instead of
 * leaving duplicates behind.
 */
export function buildImagePath(userId: string, projectId: string, snagId: string, mimeType = "image/jpeg") {
  const ext = { "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" }[mimeType] ?? "jpg";
  return `${userId}/${projectId}/${snagId}.${ext}`;
}

export function getPublicImageUrl(supabase: TypedSupabaseClient, path: string): string {
  return supabase.storage.from(SNAG_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Upload a photo with progress reporting.
 *
 * supabase-js' storage.upload() uses fetch(), which can't report upload
 * progress. On a slow site connection a progress bar is the difference
 * between "it's working" and "it's frozen", so this calls the same Storage
 * REST endpoint via XMLHttpRequest instead.
 */
export async function uploadImage(
  supabase: TypedSupabaseClient,
  path: string,
  file: Blob,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession(); // refreshes the token if it has expired
  if (!session) throw new ServiceError("Your session has expired. Please sign in again.", "no_session");

  const { url, anonKey } = getSupabaseEnv();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${url}/storage/v1/object/${SNAG_IMAGES_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "true"); // a retry overwrites its own earlier attempt
    xhr.setRequestHeader("cache-control", "max-age=31536000"); // photos never change at a given path
    xhr.setRequestHeader("content-type", file.type || "image/jpeg");
    xhr.timeout = 120_000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (${xhr.status})`;
      try {
        message = JSON.parse(xhr.responseText).message ?? message;
      } catch {}
      // 4xx (except timeout / rate limit) won't succeed on retry: too big, wrong type, not allowed.
      const permanent = xhr.status >= 400 && xhr.status < 500 && xhr.status !== 408 && xhr.status !== 429;
      reject(new ServiceError(message, permanent ? "upload_rejected" : "upload_failed"));
    };
    xhr.onerror = () => reject(new ServiceError("Upload failed. Check your signal.", "network"));
    xhr.ontimeout = () => reject(new ServiceError("Upload timed out. Check your signal.", "network"));
    xhr.send(file);
  });
}

/**
 * Remove photo files from Storage. Best-effort: a failure here leaves an
 * orphaned file but must never block deleting the database record.
 */
export async function removeImages(supabase: TypedSupabaseClient, paths: string[]): Promise<void> {
  paths = paths.filter(Boolean);
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(SNAG_IMAGES_BUCKET).remove(paths);
  if (error) console.warn("Could not remove images from storage:", error.message);
}
