"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutationState } from "@tanstack/react-query";
import { ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/states";
import { useProject } from "@/hooks/use-projects";
import { discardCapture, useCreateSnag, useSnags, type CapturePhoto, type SnagCapture } from "@/hooks/use-snags";
import { useSupabase } from "@/hooks/use-supabase";
import { mutationKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";
import { MAX_PHOTOS_PER_SNAG, type Snag } from "@/types/models";
import { CaptureList, type CaptureItem } from "./capture-list";
import { PhotoPicker, type PhotoPickerHandle } from "./photo-picker";

type FormState = {
  photos: CapturePhoto[];
  title: string;
  assignedTo: string;
  comments: string;
};

const EMPTY: FormState = { photos: [], title: "", assignedTo: "", comments: "" };

/**
 * Rapid Entry: log snag after snag without leaving the screen.
 *
 * Each snag is up to six photos plus three lines: title, assigned to, comments.
 * Tapping "Save & next" hands the snag to a background mutation (compress →
 * upload → save) and resets the form at once. The project stays selected, and
 * the list below shows each snag's progress.
 */
export function RapidEntry({ projectId }: { projectId: string }) {
  const supabase = useSupabase();
  const project = useProject(projectId);
  const snags = useSnags(projectId);
  const createSnag = useCreateSnag(projectId);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [mountedAt] = useState(() => Date.now());
  const photoRef = useRef<PhotoPickerHandle>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Every capture for this project, read straight from React Query's mutation
  // cache. Captures still running from an earlier visit show up too.
  const mutations = useMutationState({
    filters: { mutationKey: mutationKeys.createSnag(projectId) },
    select: (m) => ({
      variables: m.state.variables as SnagCapture,
      status: m.state.status,
      isPaused: m.state.isPaused,
      error: m.state.error,
      data: m.state.data as Snag | undefined,
      submittedAt: m.state.submittedAt,
    }),
  });

  const items: CaptureItem[] = useMemo(() => {
    // A manual retry creates a new mutation with the same snag id; keep the latest.
    const latest = new Map<string, (typeof mutations)[number]>();
    for (const m of mutations) {
      if (!m.variables) continue;
      const prev = latest.get(m.variables.id);
      if (!prev || m.submittedAt >= prev.submittedAt) latest.set(m.variables.id, m);
    }
    return [...latest.values()]
      .filter((m) => !dismissed.has(m.variables.id))
      .filter((m) => m.submittedAt >= mountedAt || m.status === "pending" || m.status === "error")
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }, [mutations, dismissed, mountedAt]);

  const inFlight = items.filter((i) => i.status === "pending").length;
  const savedCount = items.filter((i) => i.status === "success").length;

  // Warn before closing the tab while photos are still uploading.
  useEffect(() => {
    if (!inFlight) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [inFlight]);

  // One-tap "assigned to" chips: trades used this visit first, then the
  // project's existing snags. On a walk-round the same few names repeat.
  const recentAssignees = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    const candidates = [
      ...items.map((i) => i.variables.assigned_to),
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
  }, [items, snags.data]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      titleRef.current?.focus();
      return;
    }

    // Hand off to the background mutation…
    createSnag.mutate({
      id: uuid(),
      title,
      assigned_to: form.assignedTo.trim() || null,
      description: form.comments.trim() || null,
      photos: form.photos, // ownership (and the previews) pass to the mutation
    });

    // …and reset at once, ready for the next defect.
    setForm(EMPTY);
    navigator.vibrate?.(30);
    window.scrollTo({ top: 0, behavior: "smooth" });
    photoRef.current?.focus();
  }

  function retry(item: CaptureItem) {
    createSnag.mutate(item.variables);
  }

  async function discard(item: CaptureItem) {
    setDismissed((d) => new Set(d).add(item.variables.id));
    await discardCapture(supabase, item.variables);
    toast("Snag discarded");
  }

  if (project.error) {
    return <ErrorState message={project.error.message} onRetry={() => project.refetch()} />;
  }

  return (
    <div className="grid gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href={`/projects/${projectId}`}>
            <ChevronLeft /> Done
          </Link>
        </Button>
        <p className="text-muted-foreground text-sm tabular-nums" aria-live="polite">
          {savedCount > 0 && `${savedCount} saved`}
          {savedCount > 0 && inFlight > 0 && " · "}
          {inFlight > 0 && `${inFlight} uploading`}
        </p>
      </div>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">Add snags</h1>
        {project.data ? (
          <p className="text-muted-foreground truncate text-sm">{project.data.name}</p>
        ) : (
          <Skeleton className="mt-1 h-4 w-40" />
        )}
      </div>

      <form onSubmit={submit} className="grid gap-4" aria-label="New snag">
        <PhotoPicker
          ref={photoRef}
          value={form.photos}
          onChange={(photos) => update("photos", photos)}
          onLimitReached={(skipped) =>
            toast.warning(`Up to ${MAX_PHOTOS_PER_SNAG} photos per snag: ${skipped} not added.`)
          }
        />

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
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Recently assigned">
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

        {/* Sticky so it's always under the thumb, even with the keyboard open. */}
        <div className="bg-background/95 sticky bottom-0 -mx-4 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
          <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!form.title.trim()}>
            <Plus className="size-5" /> Save &amp; add next
          </Button>
        </div>
      </form>

      {items.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-sm font-medium">Logged this visit</h2>
          <CaptureList items={items} onRetry={retry} onDiscard={discard} />
        </section>
      )}
    </div>
  );
}
