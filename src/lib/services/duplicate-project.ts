import type { TypedSupabaseClient } from "@/lib/supabase/client";
import type { Project } from "@/types/models";
import { uuid } from "@/lib/uuid";
import { ServiceError } from "./errors";
import { listLevels, createLevel } from "./levels";
import { createProject, deleteProject, getProject } from "./projects";
import { SNAG_IMAGES_BUCKET, buildImagePath, getPublicImageUrl, removeImages, uploadImage } from "./storage";

export type DuplicateProgress = { done: number; total: number };

/**
 * Copy a file within the photo bucket. Storage copies it on the server, so
 * nothing large goes through the phone; if that isn't possible, download and
 * upload it again.
 */
async function copyFile(supabase: TypedSupabaseClient, from: string, to: string, publicUrl: string | null) {
  const { error } = await supabase.storage.from(SNAG_IMAGES_BUCKET).copy(from, to);
  if (!error) return;
  if (!publicUrl) throw new ServiceError("Couldn’t copy a drawing.", "copy_failed");
  const res = await fetch(publicUrl);
  if (!res.ok) throw new ServiceError("Couldn’t copy a drawing.", "copy_failed");
  await uploadImage(supabase, to, await res.blob());
}

/**
 * A new project with the same details, levels and drawings as `sourceId`
 * (issues aren't copied). Drawings are real copies, so deleting either
 * project never affects the other. If anything fails, the half-made copy is
 * removed again.
 */
export async function duplicateProject(
  supabase: TypedSupabaseClient,
  sourceId: string,
  input: { name: string },
  onProgress?: (p: DuplicateProgress) => void,
): Promise<Project> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new ServiceError("Please sign in again.", "no_session");

  const [source, levels] = await Promise.all([getProject(supabase, sourceId), listLevels(supabase, sourceId)]);
  const project = await createProject(supabase, {
    name: input.name,
    location: source.location,
    description: source.description,
    status: "active",
  });

  const copied: string[] = [];
  const total = levels.filter((l) => l.drawing_path).length;
  let done = 0;
  onProgress?.({ done, total });
  try {
    for (const level of levels) {
      const id = uuid();
      let drawing: { drawing_url: string; drawing_path: string } | null = null;
      if (level.drawing_path) {
        const ext = level.drawing_path.split(".").pop()?.toLowerCase();
        const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        const path = buildImagePath(userId, project.id, `drawings/${id}/${uuid()}`, type);
        await copyFile(supabase, level.drawing_path, path, level.drawing_url);
        copied.push(path);
        drawing = { drawing_path: path, drawing_url: getPublicImageUrl(supabase, path) };
        onProgress?.({ done: ++done, total });
      }
      await createLevel(supabase, {
        id,
        project_id: project.id,
        name: level.name,
        position: level.position,
        ...(drawing ?? {}),
        drawing_width: drawing ? level.drawing_width : null,
        drawing_height: drawing ? level.drawing_height : null,
      });
    }
  } catch (err) {
    await deleteProject(supabase, project.id).catch(() => undefined);
    await removeImages(supabase, copied).catch(() => undefined);
    if (err instanceof ServiceError && err.code === "no_session") throw err;
    throw new ServiceError("Couldn’t duplicate the project, so nothing was changed. Check your signal and try again.", "duplicate_failed");
  }
  return project;
}
