"use client";

import { useSyncExternalStore } from "react";

/**
 * Live progress for snags being captured (compressing → uploading n% → saving).
 *
 * Kept outside React Query because progress changes many times a second and
 * belongs to one device, not to the server cache. A tiny external store means
 * only the row showing that snag re-renders.
 */
export type CaptureStage = "compressing" | "uploading" | "saving";
export type CaptureProgress = {
  stage: CaptureStage;
  /** Upload progress of the current photo, 0–1. */
  fraction?: number;
  /** Which photo is being processed (1-based) out of how many. */
  photo?: number;
  photos?: number;
};

const store = new Map<string, CaptureProgress>();
const listeners = new Set<() => void>();

export function setCaptureProgress(id: string, progress: CaptureProgress | null) {
  if (progress) store.set(id, progress);
  else store.delete(id);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCaptureProgress(id: string): CaptureProgress | undefined {
  return useSyncExternalStore(
    subscribe,
    () => store.get(id),
    () => undefined,
  );
}
