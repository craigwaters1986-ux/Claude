/**
 * Offline-first saving for snags.
 *
 *   Save  → written to the outbox on this device (instant, works with no signal)
 *   Sync  → whenever there's signal: compress photos → upload → insert the snag
 *   Done  → removed from the outbox only after the server has confirmed it
 *
 * Network trouble never loses a snag: it stays "waiting" and is retried with
 * short growing pauses, and straight away when the signal or the app comes back.
 * Phones don't reliably say when signal returns (an iPhone with a weak signal
 * often still reports "online"), so while anything is waiting the app also
 * pings the server every few seconds and uploads the moment one gets through.
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
import { getSupabaseEnv } from "@/lib/supabase/env";
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
let attempt: AbortController | null = null; // the run in progress, so a dead one can be stopped
let lastActivity = 0; // last sign of life from the run in progress (progress, a finished step)
let probing = false;

/** Pause before retrying after a network failure. Kept short: the ping below usually wins anyway. */
const BACKOFF_MS = [2_000, 4_000, 8_000, 15_000, 30_000];
/** How often to check for signal while something is waiting. */
const PROBE_EVERY_MS = 4_000;
const PROBE_TIMEOUT_MS = 5_000;
/** A run with no sign of life for this long, while the server answers pings, is stuck on a dead connection. */
const STUCK_MS = 6_000;
/** Photos uploaded at the same time. More than one makes good use of a slow, laggy connection. */
const PARALLEL_UPLOADS = 3;

/** Can we reach the server right now? Any answer at all counts; only silence or an error doesn't. */
async function serverReachable(): Promise<boolean> {
  const { url, anonKey } = getSupabaseEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey }, cache: "no-store", signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** While uploads are waiting on a retry (or look stuck), ping the server and go as soon as it answers. */
async function probe() {
  if (probing || !snapshot.entries.some((e) => e.state === "waiting")) return;
  const waitingOnRetry = snapshot.nextRetryAt !== null;
  const stuck = running && Date.now() - lastActivity > STUCK_MS;
  if (!waitingOnRetry && !stuck) return;
  probing = true;
  try {
    if (!(await serverReachable())) return;
    failures = 0;
    if (!snapshot.online) set({ online: true });
    if (stuck && running) attempt?.abort(); // its connection died; the run ends and starts again at once
    else void sync();
  } finally {
    probing = false;
  }
}

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
  setInterval(() => void probe(), PROBE_EVERY_MS);
  setInterval(() => snapshot.entries.some((e) => e.state === "waiting") && !running && kick(), 60_000);

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

/**
 * Upload everything waiting. Only one run at a time.
 * Photos go up a few at a time (across issues); issues are saved one by one in
 * the order they were logged, so numbers follow the walk-round.
 */
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
    let again = false;
    do {
      rerun = false;
      again = await runOnce(supabase);
    } while (rerun || again);
  } finally {
    running = false;
    attempt = null;
    set({ syncing: null });
  }
}

const stopped = () => new ServiceError("Upload stopped.", "network");

/** One pass over the outbox. Returns true to go again straight away. */
async function runOnce(client: TypedSupabaseClient): Promise<boolean> {
  const { data } = await client.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return false; // signed out: keep everything until someone signs in again

  const entries = (await allEntries()).filter((e) => e.state === "waiting" && e.userId === userId);
  if (!entries.length) return false;

  const controller = new AbortController();
  attempt = controller;
  lastActivity = Date.now();
  const photosDone = startPhotoUploads(entries, client, controller.signal);
  const settleAll = () => Promise.allSettled([...photosDone.values()]);

  try {
    for (const entry of entries) {
      set({ syncing: entry.id });
      try {
        await photosDone.get(entry.id);
        if (controller.signal.aborted) throw stopped();
        setCaptureProgress(entry.id, { stage: "saving" });
        const snag = await createSnag(
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
          entry.photos.map((photo, position) => ({
            id: photo.id,
            position,
            image_path: photo.path!,
            image_url: getPublicImageUrl(client, photo.path!),
          })) satisfies SnagPhotoInput[],
        );
        lastActivity = Date.now();
        await deleteEntry(entry.id);
        failures = 0;
        const { photos, ...rest } = entry;
        set({ synced: [{ entry: { ...rest, photoCount: photos.length }, snag, at: Date.now() }, ...snapshot.synced].slice(0, 200) });
        queryClient?.invalidateQueries({ queryKey: snagKeys.list(entry.projectId) });
        queryClient?.invalidateQueries({ queryKey: levelKeys.list(entry.projectId) });
        queryClient?.invalidateQueries({ queryKey: projectKeys.all });
      } catch (error) {
        if (isPermanent(error)) {
          const fresh = (await getEntry(entry.id)) ?? entry; // keeps progress (paths, compressed photos)
          await putEntry({ ...fresh, state: "failed", attempts: fresh.attempts + 1, lastError: friendly(error) });
          continue; // the next issue can still go
        }
        // Network trouble: stop here (keeps the order) and go again later.
        const droppedByPing = controller.signal.aborted; // only a ping that got an answer stops a run from outside
        controller.abort();
        await settleAll(); // let the other uploads stop and record what they finished
        const fresh = (await getEntry(entry.id)) ?? entry;
        await putEntry({ ...fresh, attempts: fresh.attempts + 1, lastError: friendly(error) });
        if (droppedByPing) return true;
        const delay = BACKOFF_MS[Math.min(failures, BACKOFF_MS.length - 1)];
        failures++;
        set({ nextRetryAt: Date.now() + delay });
        retryTimer = setTimeout(() => void sync(), delay);
        return false;
      } finally {
        setCaptureProgress(entry.id, null);
        await reload();
      }
    }
    return false;
  } finally {
    controller.abort();
    await settleAll();
  }
}

/** Run at most `n` jobs at once, starting them in the order given. */
function limiter(n: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    if (active >= n || !queue.length) return;
    active++;
    queue.shift()!();
  };
  return <T>(job: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      queue.push(() =>
        job()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          }),
      );
      next();
    });
}

/**
 * Compress (once, saved back to the outbox) and upload (once) every photo still
 * to go, a few at a time, earliest issue first. Returns, per issue, a promise
 * that settles when all its photos are up.
 */
function startPhotoUploads(entries: OutboxEntry[], client: TypedSupabaseClient, signal: AbortSignal) {
  const run = limiter(PARALLEL_UPLOADS);
  const done = new Map<string, Promise<void>>();
  for (const entry of entries) {
    const total = entry.photos.length;
    const fractions: number[] = entry.photos.map((p) => (p.path ? 1 : 0));
    const report = (stage: "compressing" | "uploading", index: number) => {
      const finished = fractions.filter((f) => f === 1).length;
      setCaptureProgress(entry.id, {
        stage,
        photo: Math.min(total, Math.max(index + 1, finished + 1)),
        photos: total,
        fraction: fractions.reduce((a, b) => a + b, 0) / total,
      });
    };
    const jobs = entry.photos.map((photo, index) =>
      photo.path
        ? Promise.resolve()
        : run(async () => {
            if (signal.aborted) throw stopped();
            if (!photo.compressed) {
              report("compressing", index);
              photo.blob = await compressImage(photo.blob);
              photo.compressed = true;
              await putEntry(entry); // the smaller copy replaces the original on the device
            }
            if (signal.aborted) throw stopped();
            const path = buildImagePath(entry.userId, entry.projectId, `${entry.id}/${photo.id}`, photo.blob.type);
            report("uploading", index);
            await uploadImage(
              client,
              path,
              photo.blob,
              (fraction) => {
                lastActivity = Date.now();
                fractions[index] = Math.min(fraction, 0.99);
                report("uploading", index);
              },
              signal,
            );
            photo.path = path;
            fractions[index] = 1;
            lastActivity = Date.now();
            await putEntry(entry); // don't upload it again if a later step fails
          }),
    );
    const all = Promise.all(jobs).then(() => undefined);
    all.catch(() => undefined); // handled when this issue's turn comes
    done.set(entry.id, all);
  }
  return done;
}
