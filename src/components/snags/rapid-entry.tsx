"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Images, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/states";
import { useProject } from "@/hooks/use-projects";
import { usePhotoUrls, useOutbox } from "@/hooks/use-outbox";
import { useCreateSnag, useSnags, type CapturePhoto } from "@/hooks/use-snags";
import { discardEntry, retryEntry } from "@/lib/offline/outbox";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";
import { LocationPicker } from "@/components/plans/location-picker";
import { useLevels } from "@/hooks/use-levels";
import { MAX_PHOTOS_PER_SNAG, type SnagLocation } from "@/types/models";
import { CaptureList, type CaptureItem } from "./capture-list";
import { PhotoPicker, type PhotoPickerHandle } from "./photo-picker";

type FormState = {
  photos: CapturePhoto[];
  title: string;
  assignedTo: string;
  comments: string;
  location: SnagLocation;
};

const NO_LOCATION: SnagLocation = { level_id: null, pin_x: null, pin_y: null };
const EMPTY: FormState = { photos: [], title: "", assignedTo: "", comments: "", location: NO_LOCATION };

/**
 * Rapid Entry: log snag after snag without leaving the screen.
 *
 * Each snag is up to six photos plus three lines: title, assigned to, comments.
 * Tapping "Save & next" hands the snag to a background mutation (compress →
 * upload → save) and resets the form at once. The project stays selected, and
 * the list below shows each snag's progress.
 */
export function RapidEntry({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const snags = useSnags(projectId);
  const levels = useLevels(projectId);
  const createSnag = useCreateSnag(projectId);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [mountedAt] = useState(() => Date.now());
  const photoRef = useRef<PhotoPickerHandle>(null);
  const [dragging, setDragging] = useState(false);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const titleRef = useRef<HTMLInputElement>(null);

  // Every snag logged this visit, read from the outbox on this device (still
  // to upload, or refused) plus those that reached the server since opening.
  const outbox = useOutbox();
  const mine = useMemo(() => outbox.entries.filter((e) => e.projectId === projectId), [outbox.entries, projectId]);
  const urls = usePhotoUrls(mine);
  const items: CaptureItem[] = useMemo(() => {
    const local: (CaptureItem & { at: number })[] = mine.map((e) => ({
      id: e.id,
      title: e.title,
      photoCount: e.photos.length,
      thumb: e.photos[0] ? (urls.get(e.photos[0].id) ?? null) : null,
      status: e.state === "failed" ? "error" : "pending",
      waiting:
        outbox.syncing === e.id
          ? "uploading"
          : !outbox.online
            ? "offline"
            : e.attempts > 0
              ? "retrying"
              : "queued",
      error: e.lastError,
      at: e.createdAt,
    }));
    const done: (CaptureItem & { at: number })[] = outbox.synced
      .filter((s) => s.entry.projectId === projectId && s.at >= mountedAt)
      .map((s) => ({
        id: s.entry.id,
        title: s.snag.title,
        photoCount: s.entry.photoCount,
        thumb: s.snag.photos[0]?.image_url ?? null,
        status: "success",
        snagNumber: s.snag.snag_number,
        at: s.entry.createdAt,
      }));
    return [...local, ...done].sort((x, y) => y.at - x.at);
  }, [mine, urls, outbox.synced, outbox.syncing, outbox.online, projectId, mountedAt]);

  const toUpload = items.filter((i) => i.status === "pending").length;
  const savedCount = items.filter((i) => i.status === "success").length;

  // Laptop: drop photos from a folder anywhere on the page to add them.
  useEffect(() => {
    let depth = 0; // dragenter/leave fire for every child element
    const hasFiles = (e: DragEvent) => [...(e.dataTransfer?.types ?? [])].includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      setDragging(true);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault(); // allow dropping
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      photoRef.current?.addFiles(e.dataTransfer?.files ?? null);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, []);

  // One-tap "assigned to" chips: trades used this visit first, then the
  // project's existing snags. On a walk-round the same few names repeat.
  const recentAssignees = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    const candidates = [
      ...[...mine].reverse().map((e) => e.assigned_to),
      ...outbox.synced.filter((x) => x.entry.projectId === projectId).map((x) => x.entry.assigned_to),
      ...[...(snags.data ?? [])].reverse().map((s) => s.assigned_to),
    ];
    for (const name of candidates) {
      const key = name?.trim().toLowerCase();
      if (!name || !key || seen.has(key)) continue;
      seen.add(key);
      result.push(name.trim());
      if (result.length === 6) break;
    }
    return result;
  }, [mine, outbox.synced, projectId, snags.data]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Ctrl+Enter / ⌘+Enter saves from any field, including Comments.
  function onFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.requestSubmit();
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      titleRef.current?.focus();
      return;
    }

    // Saved on this device first (works with no signal), uploaded in the background…
    const capture = {
      id: uuid(),
      title,
      assigned_to: form.assignedTo.trim() || null,
      description: form.comments.trim() || null,
      ...form.location,
      photos: form.photos,
    };
    createSnag.save(capture).catch((err) => toast.error(err instanceof Error ? err.message : "Couldn’t save the snag"));

    // …and reset at once, ready for the next defect.
    // The level stays selected (you snag one floor at a time); the pin is per snag.
    setForm({ ...EMPTY, location: { ...NO_LOCATION, level_id: form.location.level_id } });
    navigator.vibrate?.(30);
    window.scrollTo({ top: 0, behavior: "smooth" });
    photoRef.current?.focus();
  }

  function retry(item: CaptureItem) {
    void retryEntry(item.id);
  }

  async function discard(item: CaptureItem) {
    await discardEntry(item.id);
    toast("Snag discarded");
  }

  if (project.error) {
    return <ErrorState message={project.error.message} onRetry={() => project.refetch()} />;
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href={`/projects/${projectId}`}>
            <ChevronLeft /> Done
          </Link>
        </Button>
        <p className="text-muted-foreground text-sm tabular-nums" aria-live="polite">
          {savedCount > 0 && `${savedCount} saved`}
          {savedCount > 0 && toUpload > 0 && " · "}
          {toUpload > 0 && `${toUpload} to upload`}
        </p>
      </div>

      <div>
        <h1 className="text-[28px] leading-tight font-bold lg:text-4xl">Add snags</h1>
        {project.data ? (
          <p className="text-muted-foreground truncate text-sm">{project.data.name}</p>
        ) : (
          <Skeleton className="mt-1 h-4 w-40" />
        )}
      </div>

      {dragging && (
        <div
          className="bg-header/70 pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-8 backdrop-blur-sm"
          aria-hidden
        >
          <div className="border-brand text-header-foreground flex flex-col items-center gap-2 rounded-3xl border-4 border-dashed px-12 py-10 text-center">
            <Images className="size-10" />
            <p className="text-xl font-semibold">Drop photos to add them</p>
            <p className="text-sm text-white/70">Up to {MAX_PHOTOS_PER_SNAG} per snag</p>
          </div>
        </div>
      )}

      <form
        onSubmit={submit}
        onKeyDown={onFormKeyDown}
        className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-8"
        aria-label="New snag"
      >
        <div className="lg:surface lg:p-4">
        <PhotoPicker
          ref={photoRef}
          value={form.photos}
          onChange={(photos) => update("photos", photos)}
          onLimitReached={(skipped) =>
            toast.warning(`Up to ${MAX_PHOTOS_PER_SNAG} photos per snag: ${skipped} not added.`)
          }
        />
        </div>

        <div className="grid gap-4 lg:surface lg:p-5">
        <div className="grid gap-2">
          <Label htmlFor="snag-title">Title</Label>
          <Input
            ref={titleRef}
            id="snag-title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Cracked floor tile"
            maxLength={200}
            autoComplete="off"
            enterKeyHint="next"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="snag-assigned-to">Assigned to</Label>
          <Input
            id="snag-assigned-to"
            value={form.assignedTo}
            onChange={(e) => update("assignedTo", e.target.value)}
            placeholder="e.g. Plumber, Decorator, J. Smith"
            maxLength={200}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="next"
          />
          {recentAssignees.length > 0 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Recently assigned">
              {recentAssignees.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => update("assignedTo", name)}
                  className={cn(
                    "h-8 shrink-0 rounded-full border px-3 text-sm transition-colors",
                    form.assignedTo === name ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {levels.data && levels.data.length > 0 && (
          <div className="grid gap-2">
            <span className="text-sm leading-none font-medium">Location</span>
            <LocationPicker levels={levels.data} value={form.location} onChange={(location) => update("location", location)} />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="snag-comments">Comments</Label>
          <Textarea
            id="snag-comments"
            value={form.comments}
            onChange={(e) => update("comments", e.target.value)}
            placeholder="Detail for whoever fixes it"
            rows={2}
          />
        </div>

        {/* Phone: sticky so it's always under the thumb, even with the keyboard open.
            Laptop: a normal button at the end of the form, with the shortcut shown. */}
        <div className="bg-background/95 sticky bottom-0 -mx-4 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!form.title.trim()}>
            <Plus className="size-5" /> Save &amp; add next
          </Button>
          <p className="text-muted-foreground mt-2 hidden text-center text-xs lg:block">
            or press <kbd className="bg-muted rounded border px-1.5 py-0.5 font-sans">{isMac ? "⌘" : "Ctrl"}</kbd> +{" "}
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-sans">Enter</kbd>
          </p>
        </div>
        </div>
      </form>

      {items.length > 0 && (
        <section className="grid min-w-0 grid-cols-1 gap-2">
          <h2 className="text-sm font-medium">Logged this visit</h2>
          <CaptureList items={items} onRetry={retry} onDiscard={discard} />
        </section>
      )}
    </div>
  );
}
