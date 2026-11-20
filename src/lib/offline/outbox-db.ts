/**
 * The outbox: snags saved on this device that haven't reached the server yet.
 *
 * Stored in IndexedDB (the browser's own database), so a snag and its photos
 * survive losing signal, the page reloading, switching apps and the phone
 * restarting. An entry is only removed once the server has confirmed it.
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { SnagStatus } from "@/types/models";

export type OutboxPhoto = {
  /** Client id: also names the file in Storage, so a re-upload overwrites itself. */
  id: string;
  /** The image: the original until compressed, then the smaller compressed copy. */
  blob: Blob;
  compressed: boolean;
  /** Set once the file is in Storage. */
  path?: string;
};

/** waiting: not uploaded yet (no signal, or will retry) · failed: the server refused it; needs the user. */
export type OutboxState = "waiting" | "failed";

export type OutboxEntry = {
  id: string; // = the snag's id
  userId: string;
  projectId: string;
  title: string;
  assigned_to: string | null;
  description: string | null;
  status: SnagStatus;
  level_id: string | null;
  pin_x: number | null;
  pin_y: number | null;
  photos: OutboxPhoto[];
  /** When it was logged (ms). Uploads go in this order, so snag numbers follow the walk-round. */
  createdAt: number;
  state: OutboxState;
  attempts: number;
  lastError?: string;
};

interface OutboxDB extends DBSchema {
  outbox: { key: string; value: OutboxEntry; indexes: { byCreated: number } };
}

let dbPromise: Promise<IDBPDatabase<OutboxDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<OutboxDB>("snaglist-offline", 1, {
      upgrade(database) {
        const store = database.createObjectStore("outbox", { keyPath: "id" });
        store.createIndex("byCreated", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function putEntry(entry: OutboxEntry) {
  await (await db()).put("outbox", entry);
}

export async function getEntry(id: string) {
  return (await db()).get("outbox", id);
}

export async function deleteEntry(id: string) {
  await (await db()).delete("outbox", id);
}

/** All entries, oldest first. */
export async function allEntries(): Promise<OutboxEntry[]> {
  return (await db()).getAllFromIndex("outbox", "byCreated");
}

/** Ask the browser not to clear our storage when space is short (best effort). */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    // not supported: storage is still kept in normal use
  }
}
