"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ChevronLeft, ChevronRight, ImageOff, Images, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SNAG_STATUS_CLASS } from "@/components/status-badge";
import {
  addPhotosProgressKey,
  useAddSnagPhotos,
  useDeleteSnagPhoto,
  useReplaceSnagPhoto,
  useSnags,
  useUpdateSnag,
} from "@/hooks/use-snags";
import { LocationPicker } from "@/components/plans/location-picker";
import { AnnotateDialog } from "@/components/photos/annotate-dialog";
import { useLevels } from "@/hooks/use-levels";
import { useCaptureProgress } from "@/lib/capture-progress";
import { cn } from "@/lib/utils";
import {
  MAX_PHOTOS_PER_SNAG,
  SNAG_STATUS_LABEL,
  SNAG_STATUSES,
  type ListedSnag,
  type SnagLocation,
  type SnagPhoto,
  type SnagStatus,
} from "@/types/models";
import { PhotoInputs, filesToPhotos, type PhotoInputsHandle } from "./photo-picker";

type Props = {
  projectId: string;
  /** The snag to show; null = closed. */
  snagId: string | null;
  onOpenChange: (open: boolean) => void;
};

/** A snag's photos (view, add, delete) and its details (edit). */
export function SnagDetailDialog({ projectId, snagId, onOpenChange }: Props) {
  const snags = useSnags(projectId);
  // Read the live snag from the cache, so optimistic changes show at once.
  const snag = snags.data?.find((s) => s.id === snagId);

  return (
    <Dialog open={!!snagId && !!snag} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-lg lg:max-w-5xl lg:p-8">
        {snag && <SnagDetail key={snag.id} projectId={projectId} snag={snag} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function SnagDetail({ projectId, snag, onClose }: { projectId: string; snag: ListedSnag; onClose: () => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Issue #{snag.snag_number}</DialogTitle>
        <DialogDescription className="sr-only">Photos and details of this issue</DialogDescription>
      </DialogHeader>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-8">
        <PhotoGallery projectId={projectId} snag={snag} />
        <SnagFields projectId={projectId} snag={snag} onSaved={onClose} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

function PhotoGallery({ projectId, snag }: { projectId: string; snag: ListedSnag }) {
  const addPhotos = useAddSnagPhotos(projectId);
  const deletePhoto = useDeleteSnagPhoto(projectId);
  const replacePhoto = useReplaceSnagPhoto(projectId);
  const [markingUp, setMarkingUp] = useState<SnagPhoto | null>(null);
  const inputs = useRef<PhotoInputsHandle>(null);
  const strip = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const progress = useCaptureProgress(addPhotosProgressKey(snag.id));

  const photos = snag.photos;
  const remaining = MAX_PHOTOS_PER_SNAG - photos.length;
  const uploading = addPhotos.isPending || replacePhoto.isPending;

  /** Save a marked-up copy in place of the photo. Shown at once; uploads in the background. */
  function saveMarkup(photo: SnagPhoto, blob: Blob) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error("No signal. Marking up a saved photo needs a connection; try again when you have signal.");
    }
    replacePhoto.mutate(
      { photo, blob, previewUrl: URL.createObjectURL(blob) },
      {
        onSuccess: () => toast.success("Marked-up photo saved"),
        onError: (err) => toast.error(err.message || "Couldn’t save the marked-up photo. The original is unchanged."),
      },
    );
  }

  // Track which photo is in view as the strip is swiped.
  function onScroll() {
    const el = strip.current;
    if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function scrollTo(i: number) {
    const el = strip.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  // Laptop: ← and → move between photos (unless typing in a field).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      e.preventDefault();
      const el = strip.current;
      if (!el || !el.clientWidth) return;
      const now = Math.round(el.scrollLeft / el.clientWidth);
      const next = e.key === "ArrowLeft" ? Math.max(0, now - 1) : Math.min(photos.length - 1, now + 1);
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length]);

  // After adding photos, show the newest one.
  const previousCount = useRef(photos.length);
  useEffect(() => {
    if (photos.length > previousCount.current) scrollTo(photos.length - 1);
    previousCount.current = photos.length;
  }, [photos.length]);

  function add(files: FileList | null) {
    const { photos: picked, skipped } = filesToPhotos(files, remaining);
    if (skipped) toast.warning(`Up to ${MAX_PHOTOS_PER_SNAG} photos per issue: ${skipped} not added.`);
    if (!picked.length) return;
    const startPosition = photos.reduce((max, p) => Math.max(max, p.position + 1), 0);
    addPhotos.mutate(
      { snagId: snag.id, photos: picked, startPosition },
      {
        onSuccess: () => toast.success(picked.length === 1 ? "Photo added" : `${picked.length} photos added`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function remove(photo: SnagPhoto) {
    setConfirmingDelete(null);
    deletePhoto.mutate(photo, {
      onSuccess: () => toast.success("Photo deleted"),
      onError: (err) => toast.error(err.message),
    });
  }

  const current = Math.min(index, Math.max(0, photos.length - 1));
  const uploadLabel = progress
    ? progress.stage === "uploading"
      ? `Uploading ${progress.photo} of ${progress.photos} · ${Math.round((progress.fraction ?? 0) * 100)}%`
      : progress.stage === "compressing"
        ? `Preparing ${progress.photo} of ${progress.photos}…`
        : "Saving…"
    : "Uploading…";

  return (
    <section className="grid gap-2" aria-label="Photos">
      <PhotoInputs ref={inputs} onFiles={add} testIdPrefix="detail-" />
      <AnnotateDialog
        source={markingUp?.image_url ?? null}
        open={!!markingUp}
        onOpenChange={(open) => !open && setMarkingUp(null)}
        onSave={(blob) => {
          if (markingUp) saveMarkup(markingUp, blob);
        }}
      />

      {photos.length === 0 ? (
        <div className="bg-muted text-muted-foreground flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl">
          <ImageOff className="size-6" />
          <span className="text-sm">No photos yet</span>
        </div>
      ) : (
        <div className="relative">
          <ul
            ref={strip}
            onScroll={onScroll}
            className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto rounded-xl bg-black [scrollbar-width:none]"
            aria-label={`${photos.length} photos`}
            data-testid="photo-strip"
          >
            {photos.map((photo, i) => {
              const pending = !photo.image_path;
              return (
                <li key={photo.id} className="relative h-full w-full shrink-0 snap-center" data-testid="gallery-photo">
                  {pending ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.image_url} alt={`Photo ${i + 1}, uploading`} className="size-full object-contain opacity-60" />
                  ) : (
                    <a href={photo.image_url} target="_blank" rel="noreferrer" aria-label={`Open photo ${i + 1} full size`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.image_url} alt={`Photo ${i + 1}`} className="size-full object-contain" />
                    </a>
                  )}

                  {pending && (
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/60 py-2 text-xs text-white">
                      <Loader2 className="size-3.5 animate-spin" /> {uploadLabel}
                    </span>
                  )}
                  {i === 0 && !pending && (
                    <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      Cover
                    </span>
                  )}

                  {!pending &&
                    (confirmingDelete === photo.id ? (
                      <span className="absolute top-2 right-2 flex gap-1">
                        <Button type="button" size="sm" variant="secondary" onClick={() => setConfirmingDelete(null)}>
                          Keep
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => remove(photo)}>
                          <Trash2 /> Delete
                        </Button>
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 flex gap-1.5">
                        {!photo.id.startsWith("legacy-") && (
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="bg-card/90"
                            onClick={() => setMarkingUp(photo)}
                            disabled={uploading}
                            aria-label={`Mark up photo ${i + 1}`}
                          >
                            <Pencil />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="bg-card/90"
                          onClick={() => setConfirmingDelete(photo.id)}
                          aria-label={`Delete photo ${i + 1}`}
                        >
                          <Trash2 />
                        </Button>
                      </span>
                    ))}
                </li>
              );
            })}
          </ul>

          {photos.length > 1 && (
            <>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute top-1/2 left-2 hidden -translate-y-1/2 bg-card/80 sm:inline-flex"
                onClick={() => scrollTo(Math.max(0, current - 1))}
                disabled={current === 0}
                aria-label="Previous photo"
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute top-1/2 right-2 hidden -translate-y-1/2 bg-card/80 sm:inline-flex"
                onClick={() => scrollTo(Math.min(photos.length - 1, current + 1))}
                disabled={current === photos.length - 1}
                aria-label="Next photo"
              >
                <ChevronRight />
              </Button>
              <span
                className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white tabular-nums"
                aria-live="polite"
              >
                {current + 1} / {photos.length}
              </span>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => inputs.current?.openCamera()} disabled={remaining <= 0 || uploading}>
          <Camera /> Take photo
        </Button>
        <Button type="button" variant="outline" onClick={() => inputs.current?.openGallery()} disabled={remaining <= 0 || uploading}>
          <Images /> Add from gallery
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        {photos.length} of {MAX_PHOTOS_PER_SNAG} photos{remaining <= 0 ? " (maximum reached)" : ""}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------

function SnagFields({ projectId, snag, onSaved }: { projectId: string; snag: ListedSnag; onSaved: () => void }) {
  const updateSnag = useUpdateSnag(projectId);
  const [title, setTitle] = useState(snag.title);
  const [assignedTo, setAssignedTo] = useState(snag.assigned_to ?? "");
  const [comments, setComments] = useState(snag.description ?? "");
  const [status, setStatus] = useState<SnagStatus>(snag.status);
  const levels = useLevels(projectId);
  const [location, setLocation] = useState<SnagLocation>({ level_id: snag.level_id, pin_x: snag.pin_x, pin_y: snag.pin_y });

  const dirty =
    location.level_id !== snag.level_id ||
    location.pin_x !== snag.pin_x ||
    location.pin_y !== snag.pin_y ||
    title.trim() !== snag.title ||
    (assignedTo.trim() || null) !== (snag.assigned_to ?? null) ||
    (comments.trim() || null) !== (snag.description ?? null) ||
    status !== snag.status;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await updateSnag.mutateAsync({
        snagId: snag.id,
        patch: {
          title: title.trim(),
          assigned_to: assignedTo.trim() || null,
          description: comments.trim() || null,
          status,
          ...location,
        },
      });
      toast.success("Issue updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update issue");
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4" aria-label="Issue details">
      <div className="grid gap-2">
        <Label htmlFor="detail-title">Title</Label>
        <Input id="detail-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="detail-assigned">Assigned to</Label>
        <Input
          id="detail-assigned"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder="e.g. Plumber"
          maxLength={200}
          autoCapitalize="words"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="detail-comments">Comments</Label>
        <Textarea id="detail-comments" value={comments} onChange={(e) => setComments(e.target.value)} rows={2} />
      </div>
      {levels.data && levels.data.length > 0 && (
        <div className="grid gap-2">
          <span className="text-sm leading-none font-medium">Location</span>
          <LocationPicker levels={levels.data} value={location} onChange={setLocation} />
        </div>
      )}
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Status</legend>
        <div className="grid grid-cols-3 gap-2">
          {SNAG_STATUSES.map((s) => (
            <label
              key={s}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center gap-1 rounded-md border text-sm font-medium transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                status === s ? cn(SNAG_STATUS_CLASS[s], "border-transparent") : "hover:bg-accent",
              )}
            >
              <input type="radio" name="detail-status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
              {status === s && <Check className="size-3.5" />}
              {SNAG_STATUS_LABEL[s]}
            </label>
          ))}
        </div>
      </fieldset>
      <DialogFooter>
        <Button type="submit" size="lg" disabled={!dirty || !title.trim() || updateSnag.isPending}>
          {updateSnag.isPending && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}
