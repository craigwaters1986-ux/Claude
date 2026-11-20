"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsKeys } from "@/lib/query-keys";
import { getSettings, saveSettings } from "@/lib/services/settings";
import {
  DEFAULT_SETTINGS,
  applyAppearance,
  readLocalSettings,
  writeLocalSettings,
  type Settings,
} from "@/lib/settings/settings";
import { useSupabase } from "./use-supabase";

/**
 * The user's settings. Starts from this device's copy (instant, works offline),
 * then follows the account's copy, so changes made on another device arrive.
 */
export function useSettings() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: settingsKeys.mine,
    queryFn: async () => {
      // Signed out (e.g. the sign-in page): nothing to fetch, use this device's copy.
      const { data } = await supabase.auth.getSession();
      return data.session ? getSettings(supabase) : readLocalSettings();
    },
  });
  // The first render must match the server's (which can't see this device's
  // settings), or React has to redraw the page. So: defaults for that first
  // render, then this device's copy, then the account's. (The theme itself is
  // already on the page from the early script in layout.tsx, so nothing flickers.)
  const mounted = useHydrated();
  const settings = !mounted ? DEFAULT_SETTINGS : (query.data ?? readLocalSettings());

  /** Change some settings: applied at once, saved to the device and the account. */
  const update = useCallback(
    async (patch: Partial<Settings>) => {
      // Don't let a refresh that's already on its way overwrite this change.
      await queryClient.cancelQueries({ queryKey: settingsKeys.mine });
      const next = { ...(queryClient.getQueryData<Settings>(settingsKeys.mine) ?? readLocalSettings()), ...patch };
      queryClient.setQueryData(settingsKeys.mine, next);
      writeLocalSettings(next);
      applyAppearance(next);
      const { data } = await supabase.auth.getSession();
      if (data.session) await saveSettings(supabase, data.session.user.id, next);
    },
    [supabase, queryClient],
  );

  return { settings, update, isLoading: query.isPending, ready: mounted };
}

/** Keeps the page's theme, accent and text size in step with the settings. */
export function useApplyAppearance() {
  const { settings, ready } = useSettings();
  useEffect(() => {
    if (!ready) return; // keep the early script's theme until the real settings are known
    writeLocalSettings(settings);
    applyAppearance(settings);
    if (settings.theme !== "system") return;
    // Follow the phone switching between light and dark (e.g. at sunset).
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyAppearance(settings);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [settings, ready]);
}

const noop = () => () => {};
/**
 * False only while React is matching the server's markup on first page load;
 * true for anything rendered after that (e.g. a dialog opened later).
 */
function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
