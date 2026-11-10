"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectKeys, snagKeys } from "@/lib/query-keys";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "@/lib/services/projects";
import { removeImages } from "@/lib/services/storage";
import type { ProjectInput, ProjectPatch } from "@/types/models";
import { useSupabase } from "./use-supabase";

export function useProjects() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () => listProjects(supabase),
  });
}

export function useProject(projectId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ""),
    queryFn: () => getProject(supabase, projectId!),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => createProject(supabase, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.list() }),
  });
}

export function useUpdateProject() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, patch }: { projectId: string; patch: ProjectPatch }) =>
      updateProject(supabase, projectId, patch),
    onSuccess: (_project, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useDeleteProject() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const imagePaths = await deleteProject(supabase, projectId);
      await removeImages(supabase, imagePaths);
    },
    onSuccess: (_void, projectId) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.removeQueries({ queryKey: snagKeys.list(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
  });
}
