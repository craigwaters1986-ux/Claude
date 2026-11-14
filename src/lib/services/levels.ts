import type { TypedSupabaseClient } from "@/lib/supabase/client";
import type { Level } from "@/types/models";
import { toServiceError } from "./errors";

export type DrawingInfo = Pick<Level, "drawing_url" | "drawing_path" | "drawing_width" | "drawing_height">;

/** A project's levels, in the order they were arranged. */
export async function listLevels(supabase: TypedSupabaseClient, projectId: string): Promise<Level[]> {
  const { data, error } = await supabase
    .from("levels")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw toServiceError(error, "Could not load levels.");
  return data;
}

export async function createLevel(
  supabase: TypedSupabaseClient,
  input: { id: string; project_id: string; name: string; position: number } & Partial<DrawingInfo>,
): Promise<Level> {
  const { data, error } = await supabase
    .from("levels")
    .insert({ ...input, name: input.name.trim() })
    .select()
    .single();
  if (error) throw toServiceError(error, "Could not create level.");
  return data;
}

export async function updateLevel(
  supabase: TypedSupabaseClient,
  levelId: string,
  patch: Partial<Pick<Level, "name" | "position"> & DrawingInfo>,
): Promise<Level> {
  const { data, error } = await supabase
    .from("levels")
    .update(patch.name !== undefined ? { ...patch, name: patch.name.trim() } : patch)
    .eq("id", levelId)
    .select()
    .single();
  if (error) throw toServiceError(error, "Could not update level.");
  return data;
}

/**
 * Delete a level. Its snags are kept; the database clears their level and pin.
 * Returns the drawing's storage path (if any) for cleanup.
 */
export async function deleteLevel(supabase: TypedSupabaseClient, levelId: string): Promise<string | null> {
  const { data, error } = await supabase.from("levels").delete().eq("id", levelId).select("drawing_path").single();
  if (error) throw toServiceError(error, "Could not delete level.");
  return data.drawing_path;
}
