"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { levelKeys, mutationKeys, projectKeys, snagKeys } from "@/lib/query-keys";
import { useSupabase } from "./use-supabase";

/**
 * Keep the screen in step with changes made on other devices.
 *
 * Subscribes to Supabase Realtime: when a snag, photo or level changes (for
 * example, logged on a phone on site), the affected lists are refetched, so a
 * laptop left open shows new snags within a second or two.
 *
 * Changes arrive in bursts (a snag, then each of its photos), so refetches are
 * batched. While this device is itself saving snags, refetching waits until
 * it finishes, so its own list doesn't flicker mid-burst.
 *
 * Returns whether the live connection is up (for a small "Live" indicator).
 */
export function useLiveUpdates(projectId?: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [live, setLive] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(function run() {
        if (projectId && queryClient.isMutating({ mutationKey: mutationKeys.createSnag(projectId) }) > 0) {
          timer = setTimeout(run, 1000); // our own capture is mid-save; try again shortly
          return;
        }
        queryClient.invalidateQueries({ queryKey: projectKeys.all });
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: snagKeys.list(projectId) });
          queryClient.invalidateQueries({ queryKey: levelKeys.list(projectId) });
        }
      }, 400);
    };

    const channel = supabase.channel(`live:${projectId ?? "all"}:${Math.random().toString(36).slice(2)}`);
    if (projectId) {
      channel
        .on("postgres_changes", { event: "*", schema: "public", table: "snags", filter: `project_id=eq.${projectId}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "levels", filter: `project_id=eq.${projectId}` }, refresh)
        // Photos carry no project id; RLS limits these to the user's own projects.
        .on("postgres_changes", { event: "*", schema: "public", table: "snag_photos" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter: `id=eq.${projectId}` }, refresh);
    } else {
      channel
        .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "snags" }, refresh);
    }
    channel.subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      clearTimeout(timer);
      setLive(false);
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, projectId]);

  return live;
}
