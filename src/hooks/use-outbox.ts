"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe, type OutboxEntry } from "@/lib/offline/outbox";
import type { ListedSnag } from "@/types/models";

/** The outbox and sync status, live. */
export function useOutbox() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Object URLs for showing outbox photos. Created from the stored images and
 * released when no longer shown, so memory doesn't build up on a long walk-round.
 */
export function usePhotoUrls(entries: OutboxEntry[]): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const key = entries.map((e) => `${e.id}:${e.photos.map((p) => `${p.id}${p.compressed ? "c" : ""}`).join(",")}`).join("|");
  useEffect(() => {
    const made = new Map<string, string>();
    for (const e of entries) for (const p of e.photos) made.set(p.id, URL.createObjectURL(p.blob));
    setUrls(made);
    return () => made.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures what matters in `entries`
  }, [key]);
  return urls;
}

/** Outbox entries for a project, shaped like snags so lists, tables and plans can show them. */
export function usePendingSnags(projectId: string | undefined): ListedSnag[] {
  const { entries, syncing } = useOutbox();
  const mine = useMemo(() => entries.filter((e) => e.projectId === projectId), [entries, projectId]);
  const urls = usePhotoUrls(mine);
  return useMemo(
    () =>
      mine.map((e) => {
        const at = new Date(e.createdAt).toISOString();
        const photos = e.photos.map((p, i) => ({
          id: p.id,
          snag_id: e.id,
          position: i,
          image_url: urls.get(p.id) ?? "",
          image_path: "",
          created_at: at,
        }));
        return {
          id: e.id,
          project_id: e.projectId,
          snag_number: 0,
          title: e.title,
          description: e.description,
          location_details: null,
          assigned_to: e.assigned_to,
          status: e.status,
          level_id: e.level_id,
          pin_x: e.pin_x,
          pin_y: e.pin_y,
          image_url: photos[0]?.image_url || null,
          image_path: null,
          created_by: null,
          created_at: at,
          updated_at: at,
          resolved_at: null,
          photos,
          _pending: true,
          _offline: e.state === "failed" ? "failed" : syncing === e.id ? "saving" : "waiting",
        } satisfies ListedSnag;
      }),
    [mine, urls, syncing],
  );
}
