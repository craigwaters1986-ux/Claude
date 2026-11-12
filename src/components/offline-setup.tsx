"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useApplyAppearance } from "@/hooks/use-settings";
import { rememberUserId } from "@/hooks/use-snags";
import { useSupabase } from "@/hooks/use-supabase";
import { startOutbox } from "@/lib/offline/outbox";

/**
 * Starts everything that keeps SnagList working without signal:
 * - the outbox sync (uploads snags saved on this device whenever there's signal)
 * - remembers who is signed in, so snags can be saved even when the session
 *   can't be refreshed offline
 * - the service worker, so the app itself opens with no signal
 */
export function OfflineSetup() {
  useApplyAppearance(); // theme, accent and text size follow the user's settings
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    startOutbox(supabase, queryClient);
    void supabase.auth.getSession().then(({ data }) => rememberUserId(data.session?.user.id));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      rememberUserId(session?.user.id);
      if (session) startOutbox(supabase, queryClient);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, queryClient]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Without it the app still works online; it just won't open with no signal.
    });
  }, []);

  // Keep an offline copy of each page as it's opened in the app, plus the
  // pages you're likely to need next on site (a project's Add snags page).
  const pathname = usePathname();
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const urls = ["/", pathname];
    const project = pathname.match(/^\/projects\/([0-9a-f-]{36})/);
    if (project) urls.push(`/projects/${project[1]}`, `/projects/${project[1]}/add`);
    const send = () =>
      navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "save-pages", urls: [...new Set(urls)] }));
    // Wait a moment so this never competes with the page's own loading.
    const timer = setTimeout(send, 1500);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
