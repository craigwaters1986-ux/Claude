import type { TypedSupabaseClient } from "@/lib/supabase/client";
import type { Snag, SnagInput, SnagPatch } from "@/types/models";
import { toServiceError } from "./errors";

/**
 * All snags for a project, ordered by their friendly number (#1, #2 …).
 * Status filtering happens client-side: a project has tens to hundreds of
 * snags, and one cached list keeps optimistic updates simple.
 */
export async function listSnags(
  supabase: TypedSupabaseClient,
  projectId: string,
): Promise<Snag[]> {
  const { data, error } = await supabase
    .from("snags")
    .select("*")
    .eq("project_id", projectId)
    .order("snag_number", { ascending: true });

  if (error) throw toServiceError(error, "Could not load snags.");
  return data;
}

export async function getSnag(supabase: TypedSupabaseClient, snagId: string): Promise<Snag> {
  const { data, error } = await supabase.from("snags").select("*").eq("id", snagId).single();
  if (error) throw toServiceError(error, "Could not load snag.");
  return data;
}

/**
 * Create a snag. The database assigns snag_number and returns the full row.
 *
 * Idempotent when an id is supplied: if the insert reached the server but the
 * response was lost (signal dropped), the retry hits a duplicate key, and we
 * return the row that already exists instead of failing.
 */
export async function createSnag(
  supabase: TypedSupabaseClient,
  input: SnagInput & { id?: string },
): Promise<Snag> {
  const { data, error } = await supabase
    .from("snags")
    .insert({ ...input, title: input.title.trim() })
    .select()
    .single();

  if (error?.code === "23505" && input.id) return getSnag(supabase, input.id);
  if (error) throw toServiceError(error, "Could not save snag.");
  return data;
}

export async function updateSnag(
  supabase: TypedSupabaseClient,
  snagId: string,
  patch: SnagPatch,
): Promise<Snag> {
  const { data, error } = await supabase
    .from("snags")
    .update(patch.title !== undefined ? { ...patch, title: patch.title.trim() } : patch)
    .eq("id", snagId)
    .select()
    .single();

  if (error) throw toServiceError(error, "Could not update snag.");
  return data;
}

/** Delete a snag. Returns its photo's storage path (if any) for cleanup. */
export async function deleteSnag(
  supabase: TypedSupabaseClient,
  snagId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("snags")
    .delete()
    .eq("id", snagId)
    .select("image_path")
    .single();

  if (error) throw toServiceError(error, "Could not delete snag.");
  return data.image_path;
}
