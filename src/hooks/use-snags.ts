"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationKeys, projectKeys, snagKeys } from "@/lib/query-keys";
import { createSnag, deleteSnag, listSnags, updateSnag } from "@/lib/services/snags";
import { removeImages } from "@/lib/services/storage";
import { uuid } from "@/lib/uuid";
import type { ListedSnag, SnagInput, SnagPatch } from "@/types/models";
import { useSupabase } from "./use-supabase";

export function useSnags(projectId: string | undefined) {
  const supabase = useSupabase();
  return useQuery<ListedSnag[]>({
    queryKey: snagKeys.list(projectId ?? ""),
    queryFn: () => listSnags(supabase, projectId!),
    enabled: !!projectId,
  });
}

/**
 * Create a snag with an optimistic update — the engine of Rapid Entry.
 *
 * The new snag appears in the list immediately (marked `_pending`) while the
 * insert runs in the background, so the form can reset straight away. Several
 * of these can be in flight at once.
 *
 * The id is generated client-side, so the optimistic row and the saved row
 * share it, and swapping one for the other is a simple id match.
 */
export function useCreateSnag(projectId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const listKey = snagKeys.list(projectId);
  const createKey = mutationKeys.createSnag(projectId);

  return useMutation({
    mutationKey: createKey,
    mutationFn: (input: Omit<SnagInput, "project_id"> & { id: string }) =>
      createSnag(supabase, { ...input, project_id: projectId }),

    onMutate: async (input) => {
      // Stop an in-flight refetch from overwriting the optimistic row.
      await queryClient.cancelQueries({ queryKey: listKey });
      const now = new Date().toISOString();
      const optimistic: ListedSnag = {
        id: input.id,
        project_id: projectId,
        snag_number: 0, // real number comes back from the database
        title: input.title,
        description: input.description ?? null,
        location_details: input.location_details ?? null,
        status: input.status ?? "open",
        image_url: input.image_url ?? null,
        image_path: input.image_path ?? null,
        created_by: null,
        created_at: now,
        updated_at: now,
        resolved_at: null,
        _pending: true,
      };
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) => [...old, optimistic]);
    },

    onSuccess: (saved) => {
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.map((s) => (s.id === saved.id ? saved : s)),
      );
    },

    onError: (_err, input) => {
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.filter((s) => s.id !== input.id),
      );
    },

    onSettled: () => {
      // Refetch once the last queued snag has finished, not after every one.
      // Refetching mid-burst would make the list flicker.
      if (queryClient.isMutating({ mutationKey: createKey }) === 1) {
        queryClient.invalidateQueries({ queryKey: listKey });
        queryClient.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
  });
}

/** Convenience: a fresh client-side id for a new snag (and its photo path). */
export const newSnagId = uuid;

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
      const imagePath = await deleteSnag(supabase, snagId);
      if (imagePath) await removeImages(supabase, [imagePath]);
    },

    onMutate: async (snagId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ListedSnag[]>(listKey);
      queryClient.setQueryData<ListedSnag[]>(listKey, (old = []) =>
        old.filter((s) => s.id !== snagId),
      );
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
