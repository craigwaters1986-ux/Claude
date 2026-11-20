import type { TypedSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Project, ProjectInput, ProjectPatch, ProjectSummary } from "@/types/models";
import { toServiceError } from "./errors";

type SummaryRow = Database["public"]["Views"]["project_summaries"]["Row"];

/** View columns are nullable in generated types; give callers a clean shape. */
function normaliseSummary(row: SummaryRow): ProjectSummary {
  return {
    id: row.id!,
    owner_id: row.owner_id!,
    name: row.name ?? "",
    description: row.description,
    location: row.location,
    status: row.status ?? "active",
    snag_counter: row.snag_counter ?? 0,
    created_at: row.created_at!,
    updated_at: row.updated_at!,
    total_snags: Number(row.total_snags ?? 0),
    open_snags: Number(row.open_snags ?? 0),
    in_progress_snags: Number(row.in_progress_snags ?? 0),
    resolved_snags: Number(row.resolved_snags ?? 0),
    last_activity_at: row.last_activity_at ?? row.updated_at ?? row.created_at!,
  };
}

/** All of the current user's projects with snag counts, most recently worked on first. */
export async function listProjects(supabase: TypedSupabaseClient): Promise<ProjectSummary[]> {
  const { data, error } = await supabase
    .from("project_summaries")
    .select("*")
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw toServiceError(error, "Could not load projects.");
  return data.map(normaliseSummary);
}

/** One project with snag counts (used by the project page and the PDF header). */
export async function getProject(
  supabase: TypedSupabaseClient,
  projectId: string,
): Promise<ProjectSummary> {
  const { data, error } = await supabase
    .from("project_summaries")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) throw toServiceError(error, "Could not load project.");
  return normaliseSummary(data);
}

export async function createProject(
  supabase: TypedSupabaseClient,
  input: ProjectInput,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...input, name: input.name.trim() })
    .select()
    .single();

  if (error) throw toServiceError(error, "Could not create project.");
  return data;
}

export async function updateProject(
  supabase: TypedSupabaseClient,
  projectId: string,
  patch: ProjectPatch,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(patch.name !== undefined ? { ...patch, name: patch.name.trim() } : patch)
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw toServiceError(error, "Could not update project.");
  return data;
}

/**
 * Delete a project. Its snags are removed by ON DELETE CASCADE.
 * Returns the storage paths of the project's photos and drawings so the caller can remove
 * the files too (the database can't delete Storage objects by itself).
 */
export async function deleteProject(
  supabase: TypedSupabaseClient,
  projectId: string,
): Promise<string[]> {
  // Every photo of every snag, plus any cover saved by an older app version.
  const { data: snags, error: listError } = await supabase
    .from("snags")
    .select("image_path, snag_photos(image_path)")
    .eq("project_id", projectId);

  if (listError) throw toServiceError(listError, "Could not delete project.");

  const { data: levels, error: levelsError } = await supabase
    .from("levels")
    .select("drawing_path")
    .eq("project_id", projectId);
  if (levelsError) throw toServiceError(levelsError, "Could not delete project.");

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw toServiceError(error, "Could not delete project.");

  const paths = (snags as { image_path: string | null; snag_photos: { image_path: string }[] | null }[]).flatMap(
    (s) => [s.image_path, ...(s.snag_photos ?? []).map((p) => p.image_path)],
  );
  const drawings = levels.map((l) => l.drawing_path);
  return [...new Set([...paths, ...drawings].filter((p): p is string => !!p))];
}
