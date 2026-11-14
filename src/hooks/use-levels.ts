"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prepareDrawing } from "@/lib/drawings/prepare";
import { levelKeys, snagKeys } from "@/lib/query-keys";
import { ServiceError } from "@/lib/services/errors";
import { createLevel, deleteLevel, listLevels, updateLevel, type DrawingInfo } from "@/lib/services/levels";
import { buildImagePath, getPublicImageUrl, removeImages, uploadImage } from "@/lib/services/storage";
import type { TypedSupabaseClient } from "@/lib/supabase/client";
import { uuid } from "@/lib/uuid";
import type { Level } from "@/types/models";
import { useSupabase } from "./use-supabase";

export type DrawingFile = { file: File; pdfPage?: number };
export type DrawingProgress = { stage: "preparing" } | { stage: "uploading"; fraction: number } | { stage: "saving" };

export function useLevels(projectId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: levelKeys.list(projectId ?? ""),
    queryFn: () => listLevels(supabase, projectId!),
    enabled: !!projectId,
  });
}

/**
 * Convert a drawing to an image and upload it.
 * Each upload gets a new file name: drawings are cached by browsers for a
 * year, so replacing a file in place would keep showing the old revision.
 */
async function uploadDrawing(
  supabase: TypedSupabaseClient,
  projectId: string,
  levelId: string,
  drawing: DrawingFile,
  onProgress?: (p: DrawingProgress) => void,
): Promise<DrawingInfo> {
  onProgress?.({ stage: "preparing" });
  const prepared = await prepareDrawing(drawing.file, drawing.pdfPage);

  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new ServiceError("Your session has expired. Please sign in again.", "no_session");
  const path = buildImagePath(data.session.user.id, projectId, `drawings/${levelId}/${uuid()}`, prepared.blob.type);

  onProgress?.({ stage: "uploading", fraction: 0 });
  await uploadImage(supabase, path, prepared.blob, (fraction) => onProgress?.({ stage: "uploading", fraction }));
  return {
    drawing_path: path,
    drawing_url: getPublicImageUrl(supabase, path),
    drawing_width: prepared.width,
    drawing_height: prepared.height,
  };
}

export function useCreateLevel(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      drawing,
      onProgress,
    }: {
      name: string;
      drawing?: DrawingFile | null;
      onProgress?: (p: DrawingProgress) => void;
    }) => {
      const id = uuid();
      const info: Partial<DrawingInfo> = drawing ? await uploadDrawing(supabase, projectId, id, drawing, onProgress) : {};
      onProgress?.({ stage: "saving" });
      const existing = queryClient.getQueryData<Level[]>(levelKeys.list(projectId)) ?? [];
      const position = existing.reduce((max, l) => Math.max(max, l.position + 1), 0);
      try {
        return await createLevel(supabase, { id, project_id: projectId, name, position, ...info });
      } catch (err) {
        if (info.drawing_path) await removeImages(supabase, [info.drawing_path]);
        throw err;
      }
    },
    onSuccess: (level) => {
      queryClient.setQueryData<Level[]>(levelKeys.list(projectId), (old = []) => [...old, level]);
    },
  });
}

/** Rename a level and/or replace its drawing. Pins stay where they are on the new revision. */
export function useUpdateLevel(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      level,
      name,
      drawing,
      onProgress,
    }: {
      level: Level;
      name?: string;
      drawing?: DrawingFile | null;
      onProgress?: (p: DrawingProgress) => void;
    }) => {
      const info: Partial<DrawingInfo> = drawing
        ? await uploadDrawing(supabase, projectId, level.id, drawing, onProgress)
        : {};
      onProgress?.({ stage: "saving" });
      const saved = await updateLevel(supabase, level.id, { ...(name !== undefined ? { name } : {}), ...info });
      if (drawing && level.drawing_path) await removeImages(supabase, [level.drawing_path]); // old revision
      return saved;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<Level[]>(levelKeys.list(projectId), (old = []) =>
        old.map((l) => (l.id === saved.id ? saved : l)),
      );
    },
  });
}

export function useDeleteLevel(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (levelId: string) => {
      const path = await deleteLevel(supabase, levelId);
      if (path) await removeImages(supabase, [path]);
    },
    onSuccess: (_void, levelId) => {
      queryClient.setQueryData<Level[]>(levelKeys.list(projectId), (old = []) => old.filter((l) => l.id !== levelId));
      // Snags on that level lost their level and pin.
      queryClient.invalidateQueries({ queryKey: snagKeys.list(projectId) });
    },
  });
}
