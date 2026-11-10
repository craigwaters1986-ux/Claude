import type { TypedSupabaseClient } from "@/lib/supabase/client";

export const SNAG_IMAGES_BUCKET = "snag-images";

/**
 * Remove photo files from Storage. Best-effort: a failure here leaves an
 * orphaned file but must never block deleting the database record.
 * (Uploading lives in Step 4, alongside compression.)
 */
export async function removeImages(
  supabase: TypedSupabaseClient,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(SNAG_IMAGES_BUCKET).remove(paths);
  if (error) console.warn("Could not remove images from storage:", error.message);
}
