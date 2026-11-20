"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userStateKeys } from "@/lib/query-keys";
import { getUserState, saveUserState } from "@/lib/services/user-state";
import type { ProjectMode, UserState } from "@/types/models";
import { useSupabase } from "./use-supabase";

/** Where this user last was, from any of their devices. */
export function useUserState() {
  const supabase = useSupabase();
  return useQuery({ queryKey: userStateKeys.mine, queryFn: () => getUserState(supabase) });
}

function deviceKind(): UserState["device"] {
  if (typeof window === "undefined") return null;
  const w = window.innerWidth;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch && w < 768) return "phone";
  if (touch) return "tablet";
  return "desktop";
}

/**
 * Remember the project and view the user is on, so another device can pick
 * up from here. Saved shortly after the user settles (not on every tap), and
 * failures are ignored: this is a convenience, never worth an error message.
 */
export function useRememberPlace(projectId: string, view: ProjectMode, levelId: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const last = useRef<string>("");

  useEffect(() => {
    const key = `${projectId}|${view}|${levelId ?? ""}`;
    if (key === last.current) return;
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user.id;
        if (!userId) return;
        const place = { project_id: projectId, view, level_id: view === "plans" ? levelId : null, device: deviceKind() };
        await saveUserState(supabase, userId, place);
        last.current = key;
        queryClient.setQueryData<UserState | null>(userStateKeys.mine, (old) => ({
          user_id: userId,
          updated_at: new Date().toISOString(),
          ...(old ?? {}),
          ...place,
        }));
      } catch {
        // ignore: a missed save just means "Continue" points one step back
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [supabase, queryClient, projectId, view, levelId]);
}
