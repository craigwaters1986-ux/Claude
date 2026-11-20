"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

const RUNNING = process.env.NEXT_PUBLIC_BUILD_ID;
const CHECK_EVERY_MS = 15 * 60_000;

/** The build that's live on the server, or null if we can't tell (no signal, slow). */
async function liveBuild(): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch("/api/version", { cache: "no-store", signal: controller.signal });
    if (!res.ok) return null;
    const { id } = (await res.json()) as { id?: string | null };
    return id || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Load the new version: drop the saved copies of pages first, so the reload can't open an old one. */
async function reloadToLatest() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
    reg?.active?.postMessage({ type: "clear-pages" });
    await new Promise((r) => setTimeout(r, 300));
  } catch {
    // reload anyway
  }
  window.location.reload();
}

/**
 * Keeps the app up to date without anyone having to close it: when the app
 * opens or comes back to the screen, check whether a newer version is live and
 * switch to it. On Add issues (where a reload could lose what's being typed) it
 * asks first instead. Snags waiting to upload are safe either way: they're
 * stored on the phone.
 */
export function useAppUpdate() {
  const pathname = usePathname();
  const path = useRef(pathname);
  path.current = pathname;

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !RUNNING) return;
    let asked = false;
    let checking = false;

    async function check() {
      if (checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const live = await liveBuild();
        if (!live || live === RUNNING) return;
        // Never loop: one automatic reload per new version.
        const key = `snaglist.updated-to.${live}`;
        let tried = false;
        try {
          tried = sessionStorage.getItem(key) === "1";
        } catch {}
        const busy = /\/add$/.test(path.current) || !!document.querySelector("[role=dialog]");
        if (!busy && !tried) {
          try {
            sessionStorage.setItem(key, "1");
          } catch {}
          await reloadToLatest();
          return;
        }
        if (!asked) {
          asked = true;
          toast("A new version of the app is ready", {
            duration: Infinity,
            action: { label: "Update", onClick: () => void reloadToLatest() },
          });
        }
      } finally {
        checking = false;
      }
    }

    void check();
    const onVisible = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = setInterval(check, CHECK_EVERY_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(timer);
    };
  }, []);
}
