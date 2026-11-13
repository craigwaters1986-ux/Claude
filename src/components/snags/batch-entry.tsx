"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Images, ListPlus, Loader2, MapPin, MapPinOff, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PinDialog } from "@/components/plans/pin-dialog";
import { AnnotateDialog } from "@/components/photos/annotate-dialog";
import { useCreateSnag, type CapturePhoto } from "@/hooks/use-snags";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";
import { MAX_PHOTOS_PER_SNAG, type Level } from "@/types/models";
import { PhotoInputs, filesToPhotos, markedUpPhoto, type PhotoInputsHandle } from "./photo-picker";

/** Most snags in one batch: plenty for a room-by-room sweep, small enough to review on a phone. */
const MAX_ROWS = 50;

type Row = {
  key: string;
  title: string;
  /** Empty = use the shared "Assigned to". */
  assignedTo: string;
  photos: CapturePhoto[];
  pin: { x: number; y: number } | null;
};

const newRow = (patch: Partial<Row> = {}): Row => ({ key: uuid(), title: "", assignedTo: "", photos: [], pin: null, ...patch });

type Props = {
  projectId: string;
  levels: Level[];
  recentAssignees: string[];
  onSaved?: (count: number) => void;
};

/**
 * Add several snags in one go:
 * - from photos: pick a batch and each photo becomes a snag (with its photo attached),
 * - from a list: one issue per line,
 * then give each a title. Assigned to, level and comments are set once for the
 * batch; any row can override "assigned to" and be pinned on the plan.
 * Saved through the same on-device outbox as single snags, so it works offline.
 */
export function BatchEntry({ projectId, levels, recentAssignees, onSaved }: Props) {
  const createSnag = useCreateSnag(projectId);
  const inputs = useRef<PhotoInputsHandle>(null);
  const rowPhotoInputs = useRef<PhotoInputsHandle>(null);
  const [photoTarget, setPhotoTarget] = useState<string | null>(null); // row receiving extra photos

  const [rows, setRows] = useState<Row[]>([]);
  const [listText, setListText] = useState("");
  const [shared, setShared] = useState({ assignedTo: "", levelId: null as string | null, comments: "" });
  const [pinningRow, setPinningRow] = useState<string | null>(null);
  const [markingUpRow, setMarkingUpRow] = useState<string | null>(null); // row whose cover photo is being marked up
  const markUpPhoto = rows.find((r) => r.key === markingUpRow)?.photos[0] ?? null;
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const level = levels.find((l) => l.id === shared.levelId) ?? null;
  const missingTitles = rows.filter((r) => !r.title.trim()).length;
  const room = MAX_ROWS - rows.length;

  function patchRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((rs) => {
      rs.find((r) => r.key === key)?.photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return rs.filter((r) => r.key !== key);
    });
  }

  /** Each picked photo becomes its own snag. */
  function addPhotoRows(files: FileList | null) {
    const { photos, skipped } = filesToPhotos(files, room);
    if (photos.length) setRows((rs) => [...rs, ...photos.map((p) => newRow({ photos: [p] }))]);
    if (skipped) toast.warning(`Up to ${MAX_ROWS} issues at a time: ${skipped} photos not added.`);
  }

  /** Extra photos for one row (e.g. a wide shot and a close-up). */
  function addPhotosToRow(files: FileList | null) {
    const row = rows.find((r) => r.key === photoTarget);
    setPhotoTarget(null);
    if (!row) return;
    const { photos, skipped } = filesToPhotos(files, MAX_PHOTOS_PER_SNAG - row.photos.length);
    if (photos.length) patchRow(row.key, { photos: [...row.photos, ...photos] });
    if (skipped) toast.warning(`Up to ${MAX_PHOTOS_PER_SNAG} photos per issue: ${skipped} not added.`);
  }

  function addListRows() {
    const lines = listText
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()) // strip bullets / numbering when pasted
      .filter(Boolean);
    if (!lines.length) return;
    const kept = lines.slice(0, room);
    setRows((rs) => [...rs, ...kept.map((title) => newRow({ title: title.slice(0, 200) }))]);
    setListText("");
    if (lines.length > kept.length) toast.warning(`Up to ${MAX_ROWS} issues at a time: ${lines.length - kept.length} lines not added.`);
  }

  async function saveAll() {
    if (!rows.length) return;
    if (missingTitles) {
      setShowErrors(true);
      toast.error(`Give ${plural(missingTitles, "issue")} a title first.`);
      return;
    }
    setSaving(true);
    try {
      // In order, so snag numbers follow the list.
      for (const row of rows) {
        await createSnag.save({
          id: uuid(),
          title: row.title.trim(),
          assigned_to: row.assignedTo.trim() || shared.assignedTo.trim() || null,
          description: shared.comments.trim() || null,
          level_id: shared.levelId,
          pin_x: shared.levelId && row.pin ? row.pin.x : null,
          pin_y: shared.levelId && row.pin ? row.pin.y : null,
          photos: row.photos,
        });
      }
      const count = rows.length;
      setRows([]);
      setShowErrors(false);
      toast.success(`${plural(count, "issue")} saved`);
      onSaved?.(count);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t save the issues");
    } finally {
      setSaving(false);
    }
  }

  const pinRow = useMemo(() => rows.find((r) => r.key === pinningRow), [rows, pinningRow]);

  return (
    <div className="grid grid-cols-1 gap-5">
      <PhotoInputs ref={inputs} onFiles={addPhotoRows} testIdPrefix="batch-" />
      <PhotoInputs ref={rowPhotoInputs} onFiles={addPhotosToRow} testIdPrefix="batch-row-" />

      {/* 1. Shared details */}
      <section className="surface grid gap-4 p-4" aria-label="Applies to every issue">
        <h2 className="text-sm font-semibold">For every issue in this batch</h2>
        <div className="grid gap-2">
          <Label htmlFor="batch-assigned">Assigned to</Label>
          <Input
            id="batch-assigned"
            value={shared.assignedTo}
            onChange={(e) => setShared((s) => ({ ...s, assignedTo: e.target.value }))}
            placeholder="e.g. Decorator (each issue can be changed below)"
            maxLength={200}
            autoCapitalize="words"
          />
          {recentAssignees.length > 0 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Recently assigned">
              {recentAssignees.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setShared((s) => ({ ...s, assignedTo: name }))}
                  className={cn(
                    "h-8 shrink-0 rounded-full border px-3 text-sm transition-colors",
                    shared.assignedTo === name ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        {levels.length > 0 && (
          <div className="grid gap-2">
            <span className="text-sm leading-none font-medium">Level</span>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Level">
              {[{ id: null as string | null, name: "No level" }, ...levels].map((l) => (
                <button
                  key={l.id ?? "none"}
                  type="button"
                  aria-pressed={shared.levelId === l.id}
                  onClick={() => {
                    setShared((s) => ({ ...s, levelId: l.id }));
                    setRows((rs) => rs.map((r) => ({ ...r, pin: null }))); // pins belong to one drawing
                  }}
                  className={cn(
                    "h-8 shrink-0 rounded-full border px-3 text-sm transition-colors",
                    shared.levelId === l.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent",
                  )}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="batch-comments">
            Comments <span className="text-muted-foreground font-normal">(optional, added to every issue)</span>
          </Label>
          <Textarea
            id="batch-comments"
            value={shared.comments}
            onChange={(e) => setShared((s) => ({ ...s, comments: e.target.value }))}
            rows={2}
          />
        </div>
      </section>

      {/* 2. Add snags to the batch */}
      <section className="grid gap-3" aria-label="Add to the batch">
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="lg" onClick={() => inputs.current?.openGallery()} disabled={room <= 0}>
            <Images /> From photos
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => inputs.current?.openCamera()} disabled={room <= 0}>
            <Camera /> Take photo
          </Button>
        </div>
        <p className="text-muted-foreground -mt-1 text-xs">Each photo becomes its own issue. Pick several at once from your gallery.</p>
        <div className="grid gap-2">
          <Label htmlFor="batch-list">Or type a list, one issue per line</Label>
          <Textarea
            id="batch-list"
            value={listText}
            onChange={(e) => setListText(e.target.value)}
            placeholder={"Scuffed wall by stairs\nMissing socket cover in bedroom 2\nSealant gap around bath"}
            rows={3}
          />
          <Button type="button" variant="secondary" onClick={addListRows} disabled={!listText.trim() || room <= 0} className="justify-self-start">
            <ListPlus /> Add to batch
          </Button>
        </div>
      </section>

      {/* 3. The batch */}
      {rows.length > 0 && (
        <section className="grid gap-2" aria-label="Issues in this batch">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">
              {plural(rows.length, "issue")} ready
              {missingTitles > 0 && <span className="text-muted-foreground font-normal"> · {missingTitles} need a title</span>}
            </h2>
            <button type="button" className="text-muted-foreground text-xs underline-offset-2 hover:underline" onClick={() => setRows([])}>
              Clear all
            </button>
          </div>
          <ol className="grid grid-cols-1 gap-2">
            {rows.map((row, i) => {
              const titleMissing = showErrors && !row.title.trim();
              return (
                <li key={row.key} className="surface grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 p-2.5" data-testid="batch-row">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoTarget(row.key);
                        rowPhotoInputs.current?.openGallery();
                      }}
                      disabled={row.photos.length >= MAX_PHOTOS_PER_SNAG}
                      className="bg-muted text-muted-foreground relative flex size-16 items-center justify-center overflow-hidden rounded-lg"
                      aria-label={row.photos.length ? `Add another photo to issue ${i + 1}` : `Add a photo to issue ${i + 1}`}
                    >
                      {row.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.photos[0].previewUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <ImagePlus className="size-5" />
                      )}
                      {row.photos.length > 1 && (
                        <span className="absolute right-0.5 bottom-0.5 rounded bg-black/65 px-1 text-[10px] font-medium text-white">
                          {row.photos.length}
                        </span>
                      )}
                      {row.photos.length > 0 && row.photos.length < MAX_PHOTOS_PER_SNAG && (
                        <span className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white">
                          <Plus className="size-3" />
                        </span>
                      )}
                    </button>
                    {row.photos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMarkingUpRow(row.key)}
                        className="absolute bottom-0.5 left-0.5 flex size-7 items-center justify-center rounded-full bg-black/65 text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/70"
                        aria-label={`Mark up photo for issue ${i + 1}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid min-w-0 gap-1.5">
                    <Input
                      value={row.title}
                      onChange={(e) => patchRow(row.key, { title: e.target.value })}
                      placeholder={`Issue ${i + 1}: what’s wrong?`}
                      aria-label={`Title of issue ${i + 1}`}
                      aria-invalid={titleMissing || undefined}
                      maxLength={200}
                      className="h-10 md:h-9"
                    />
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Input
                        value={row.assignedTo}
                        onChange={(e) => patchRow(row.key, { assignedTo: e.target.value })}
                        placeholder={shared.assignedTo ? `Assigned to: ${shared.assignedTo}` : "Assigned to (optional)"}
                        aria-label={`Assigned to, issue ${i + 1}`}
                        maxLength={200}
                        className="h-9 min-w-0 flex-1 text-sm md:h-8"
                      />
                      {level?.drawing_url && (
                        <Button
                          type="button"
                          variant={row.pin ? "secondary" : "outline"}
                          size="sm"
                          className="h-9 shrink-0 md:h-8"
                          onClick={() => setPinningRow(row.key)}
                          aria-label={`${row.pin ? "Move pin" : "Pin"} for issue ${i + 1}`}
                        >
                          {row.pin ? <MapPin /> : <MapPinOff />}
                          {row.pin ? "Pinned" : "Pin"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => removeRow(row.key)}
                    aria-label={`Remove issue ${i + 1}`}
                  >
                    {row.photos.length ? <Trash2 /> : <X />}
                  </Button>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Phone: sticky like the single form; laptop: inline */}
      <div className="bg-background/95 sticky bottom-0 -mx-4 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <Button type="button" size="lg" className="h-12 w-full text-base" onClick={saveAll} disabled={!rows.length || saving}>
          {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          {rows.length ? `Save ${plural(rows.length, "issue")}` : "Add issues to the batch first"}
        </Button>
      </div>

      <AnnotateDialog
        source={markUpPhoto?.file ?? null}
        open={!!markUpPhoto}
        onOpenChange={(open) => !open && setMarkingUpRow(null)}
        onSave={(blob) => {
          const row = rows.find((r) => r.key === markingUpRow);
          if (row?.photos[0]) patchRow(row.key, { photos: [markedUpPhoto(row.photos[0], blob), ...row.photos.slice(1)] });
        }}
      />

      {level && pinRow && (
        <PinDialog
          level={level}
          open={!!pinRow}
          onOpenChange={(open) => !open && setPinningRow(null)}
          value={pinRow.pin}
          onSave={(pin) => patchRow(pinRow.key, { pin })}
        />
      )}
    </div>
  );
}
