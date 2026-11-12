/**
 * Offline-first saving for snags.
 *
 *   Save  → written to the outbox on this device (instant, works with no signal)
 *   Sync  → whenever there's signal: compress photos → upload → insert the snag
 *   Done  → removed from the outbox only after the server has confirmed it
 *
 * Network trouble never loses a snag: it stays "waiting" and is retried with
 * growing pauses, and straight away when the signal or the app comes back.
 * Only a refusal from the server (e.g. its project was deleted) marks an entry
 * "failed", and even then it's kept until the user chooses to discard it.
 *
 * Entries upload one at a time in the order they were logged, so snag numbers
 * follow the walk-round.
 */
import type { QueryClient } from "@tanstack/react-query";
import { setCaptureProgress } from "@/lib/capture-progress";
import { compressImage, UnsupportedImageError } from "@/lib/image/compress";
import { levelKeys, projectKeys, snagKeys } from "@/lib/query-keys";
import { ServiceError } from "@/lib/services/errors";
import { createSnag } from "@/lib/services/snags";
import { buildImagePath, getPublicImageUrl, removeImages, uploadImage } from "@/lib/services/storage";
import type { TypedSupabaseClient } from "@/lib/supabase/client";
import type { Snag, SnagPhotoInput } from "@/types/models";
import {
  allEntries,
  deleteEntry,
  getEntry,
  putEntry,
  requestPersistentStorage,
  type OutboxEntry,
} from "./outbox-db";

export type { OutboxEntry } from "./outbox-db";

/** A snag that reached the server during this session (for the "Logged this visit" list). */
export type SyncedCapture = { entry: Omit<OutboxEntry, "photos"> & { photoCount: number }; snag: Snag; at: number };

export type OutboxSnapshot = {
  entries: OutboxEntry[];
  /** Saved to the server since the app opened, newest first. */
  synced: SyncedCapture[];
  syncing: string | null; // id of the entry uploading now
  online: boolean;
  /** When the next automatic retry is due (ms), if waiting on one. */
  nextRetryAt: number | null;
};

// ---------------------------------------------------------------------------
// State + subscription (read with useSyncExternalStore)
// ---------------------------------------------------------------------------
let snapshot: OutboxSnapshot = {
  entries: [],
  synced: [],
  syncing: null,
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  nextRetryAt: null,
};
const listeners = new Set<() => void>();
function set(patch: Partial<OutboxSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((l) => l());
}
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const getSnapshot = () => snapshot;
const SERVER_SNAPSHOT: OutboxSnapshot = { entries: [], synced: [], syncing: null, online: true, nextRetryAt: null };
export const getServerSnapshot = () => SERVER_SNAPSHOT;

async function reload() {
  set({ entries: await allEntries() });
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
let supabase: TypedSupabaseClient | null = null;
let queryClient: QueryClient | null = null;
let started = false;
let running = false;
let rerun = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let failures = 0; // consecutive network failures, for backoff

const BACKOFF_MS = [3_000, 8_000, 20_000, 45_000, 90_000];

/** Start syncing. Safe to call more than once. */
export function startOutbox(client: TypedSupabaseClient, qc: QueryClient) {
  supabase = client;
  queryClient = qc;
  if (started || typeof window === "undefined") return;
  started = true;

  const kick = () => void sync();
  window.addEventListener("online", () => {
    set({ online: true });
    failures = 0;
    kick();
  });
  window.addEventListener("offline", () => set({ online: false }));
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && kick());
  window.addEventListener("focus", kick);
  setInterval(() => snapshot.entries.some((e) => e.state === "waiting") && kick(), 60_000);

  void requestPersistentStorage();
  void reload().then(kick);
}

/** Save a snag on this device and start uploading it. Resolves once it's safely stored locally. */
export async function addToOutbox(entry: Omit<OutboxEntry, "state" | "attempts" | "createdAt">) {
  const full: OutboxEntry = { ...entry, createdAt: Date.now(), state: "waiting", attempts: 0 };
  await putEntry(full);
  await reload();
  void sync();
}

/** Try a failed or waiting entry again now. */
export async function retryEntry(id: string) {
  const entry = await getEntry(id);
  if (!entry) return;
  await putEntry({ ...entry, state: "waiting", lastError: undefined });
  failures = 0;
  await reload();
  void sync();
}

/** Throw an entry away (and any of its photos that already reached Storage). */
export async function discardEntry(id: string) {
  const entry = await getEntry(id);
  if (!entry) return;
  const paths = entry.photos.map((p) => p.path).filter((p): p is string => !!p);
  await deleteEntry(id);
  await reload();
  if (paths.length && supabase) await removeImages(supabase, paths).catch(() => undefined);
}

function isPermanent(error: unknown): boolean {
  if (error instanceof UnsupportedImageError) return true;
  if (!(error instanceof ServiceError)) return false; // fetch failures, timeouts → network
  // Refused by the server: not allowed / bad data / its project or level was deleted.
  // P0001 = a rule in the database said no (e.g. "Project not found", photo limit).
  return ["42501", "23503", "23514", "22P02", "P0001", "upload_rejected", "PGRST116"].includes(error.code ?? "");
}

function friendly(error: unknown): string {
  if (error instanceof ServiceError && (error.code === "23503" || /not found|does not belong/i.test(error.message)))
    return "Its project or level no longer exists.";
  if (error instanceof Error) return error.message;
  return "Could not be saved.";
}

/** Upload everything waiting, oldest first. Only one run at a time. */
export async function sync(): Promise<void> {
  if (!supabase) return;
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  clearTimeout(retryTimer);
  set({ nextRetryAt: null });
  try {
    do {
      rerun = false;
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return; // signed out: keep everything until someone signs in again

      for (const entry of await allEntries()) {
        if (entry.state !== "waiting" || entry.userId !== userId) continue;
        set({ syncing: entry.id });
        try {
          const snag = await upload(entry, supabase);
          await deleteEntry(entry.id);
          failures = 0;
          const { photos, ...rest } = entry;
          set({ synced: [{ entry: { ...rest, photoCount: photos.length }, snag, at: Date.now() }, ...snapshot.synced].slice(0, 200) });
          queryClient?.invalidateQueries({ queryKey: snagKeys.list(entry.projectId) });
          queryClient?.invalidateQueries({ queryKey: levelKeys.list(entry.projectId) });
          queryClient?.invalidateQueries({ queryKey: projectKeys.all });
        } catch (error) {
          const fresh = (await getEntry(entry.id)) ?? entry; // keep progress (paths, compressed photos)
          if (isPermanent(error)) {
            await putEntry({ ...fresh, state: "failed", attempts: fresh.attempts + 1, lastError: friendly(error) });
            continue; // the next snag can still go
          }
          await putEntry({ ...fresh, attempts: fresh.attempts + 1, lastError: friendly(error) });
          // Network trouble: stop here (keeps the order) and try again later.
          const delay = BACKOFF_MS[Math.min(failures, BACKOFF_MS.length - 1)];
          failures++;
          set({ nextRetryAt: Date.now() + delay });
          retryTimer = setTimeout(() => void sync(), delay);
          return;
        } finally {
          setCaptureProgress(entry.id, null);
          await reload();
        }
      }
    } while (rerun);
  } finally {
    running = false;
    set({ syncing: null });
  }
}

/** Compress (once, saved back to the outbox), upload each photo (once), then create the snag. */
async function upload(entry: OutboxEntry, client: TypedSupabaseClient): Promise<Snag> {
  const rows: SnagPhotoInput[] = [];
  for (const [i, photo] of entry.photos.entries()) {
    const counter = { photo: i + 1, photos: entry.photos.length };
    if (!photo.compressed) {
      setCaptureProgress(entry.id, { stage: "compressing", ...counter });
      const blob = await compressImage(photo.blob);
      photo.blob = blob;
      photo.compressed = true;
      await putEntry(entry); // smaller copy replaces the original on the device
    }
    if (!photo.path) {
      const path = buildImagePath(entry.userId, entry.projectId, `${entry.id}/${photo.id}`, photo.blob.type);
      setCaptureProgress(entry.id, { stage: "uploading", fraction: 0, ...counter });
      await uploadImage(client, path, photo.blob, (fraction) =>
        setCaptureProgress(entry.id, { stage: "uploading", fraction, ...counter }),
      );
      photo.path = path;
      await putEntry(entry); // don't upload it again if the next step fails
    }
    rows.push({ id: photo.id, position: i, image_path: photo.path, image_url: getPublicImageUrl(client, photo.path) });
  }
  setCaptureProgress(entry.id, { stage: "saving" });
  return createSnag(
    client,
    {
      id: entry.id,
      project_id: entry.projectId,
      title: entry.title,
      description: entry.description,
      assigned_to: entry.assigned_to,
      status: entry.status,
      level_id: entry.level_id,
      pin_x: entry.level_id ? entry.pin_x : null,
      pin_y: entry.level_id ? entry.pin_y : null,
    },
    rows,
  );
}
