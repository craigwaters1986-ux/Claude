import type { TypedSupabaseClient } from "@/lib/supabase/client";
import type { Snag, SnagInput, SnagPatch, SnagPhoto, SnagPhotoInput, SnagRow } from "@/types/models";
import { toServiceError } from "./errors";

/** Every snag query fetches its photos in the same request. */
const SNAG_SELECT = "*, snag_photos(*)";

type SnagWithEmbed = SnagRow & { snag_photos: SnagPhoto[] | null };

/**
 * Sort photos into order. A snag that still has only the old single-photo
 * columns (e.g. saved by an older version of the app) gets that photo as its
 * one photo, so nothing ever disappears.
 */
function normalise({ snag_photos, ...row }: SnagWithEmbed): Snag {
  let photos = [...(snag_photos ?? [])].sort(
    (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
  );
  if (photos.length === 0 && row.image_url) {
    photos = [
      { id: `legacy-${row.id}`, snag_id: row.id, position: 0, image_url: row.image_url, image_path: row.image_path ?? "", created_at: row.created_at },
    ];
  }
  return { ...row, photos };
}

/**
 * All snags for a project with their photos, ordered by friendly number.
 * Status filtering happens client-side: a project has tens to hundreds of
 * snags, and one cached list keeps optimistic updates simple.
 */
export async function listSnags(supabase: TypedSupabaseClient, projectId: string): Promise<Snag[]> {
  const { data, error } = await supabase
    .from("snags")
    .select(SNAG_SELECT)
    .eq("project_id", projectId)
    .order("snag_number", { ascending: true });

  if (error) throw toServiceError(error, "Could not load snags.");
  return (data as SnagWithEmbed[]).map(normalise);
}

export async function getSnag(supabase: TypedSupabaseClient, snagId: string): Promise<Snag> {
  const { data, error } = await supabase.from("snags").select(SNAG_SELECT).eq("id", snagId).single();
  if (error) throw toServiceError(error, "Could not load snag.");
  return normalise(data as SnagWithEmbed);
}

/**
 * Create a snag and attach its (already uploaded) photos.
 * The database assigns snag_number and keeps the cover photo in sync.
 *
 * Idempotent when ids are supplied: if a request reached the server but the
 * response was lost (signal dropped), the retry recognises the snag and photos
 * that already exist instead of duplicating or failing.
 */
export async function createSnag(
  supabase: TypedSupabaseClient,
  input: SnagInput & { id: string },
  photos: SnagPhotoInput[] = [],
): Promise<Snag> {
  const { error } = await supabase.from("snags").insert({ ...input, title: input.title.trim() });
  if (error && error.code !== "23505") throw toServiceError(error, "Could not save snag.");

  if (photos.length) await addSnagPhotos(supabase, input.id, photos);
  return getSnag(supabase, input.id);
}

export async function updateSnag(supabase: TypedSupabaseClient, snagId: string, patch: SnagPatch): Promise<Snag> {
  const { data, error } = await supabase
    .from("snags")
    .update(patch.title !== undefined ? { ...patch, title: patch.title.trim() } : patch)
    .eq("id", snagId)
    .select(SNAG_SELECT)
    .single();

  if (error) throw toServiceError(error, "Could not update snag.");
  return normalise(data as SnagWithEmbed);
}

/** Attach uploaded photos to a snag. Re-sending a photo that's already attached is a no-op. */
export async function addSnagPhotos(supabase: TypedSupabaseClient, snagId: string, photos: SnagPhotoInput[]) {
  const { error } = await supabase
    .from("snag_photos")
    .upsert(photos.map((p) => ({ ...p, snag_id: snagId })), { onConflict: "id", ignoreDuplicates: true });
  if (error) throw toServiceError(error, "Could not save photos.");
}

/** Remove one photo. Returns its storage path for cleanup. */
export async function deleteSnagPhoto(supabase: TypedSupabaseClient, photo: Pick<SnagPhoto, "id" | "snag_id" | "image_path">) {
  if (photo.id.startsWith("legacy-")) {
    // Photo saved by an older app version: it only lives on the snag row.
    const { error } = await supabase.from("snags").update({ image_url: null, image_path: null }).eq("id", photo.snag_id);
    if (error) throw toServiceError(error, "Could not delete photo.");
  } else {
    const { error } = await supabase.from("snag_photos").delete().eq("id", photo.id);
    if (error) throw toServiceError(error, "Could not delete photo.");
  }
  return photo.image_path;
}

/** Delete a snag (its photo rows go with it). Returns all its photos' storage paths for cleanup. */
export async function deleteSnag(supabase: TypedSupabaseClient, snagId: string): Promise<string[]> {
  const { data, error } = await supabase.from("snags").delete().eq("id", snagId).select(SNAG_SELECT).single();
  if (error) throw toServiceError(error, "Could not delete snag.");
  return [...new Set(normalise(data as SnagWithEmbed).photos.map((p) => p.image_path).filter(Boolean))];
}
