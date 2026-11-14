"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useCreateLevel, useDeleteLevel, useUpdateLevel, type DrawingProgress } from "@/hooks/use-levels";
import { countPdfPages, isPdf } from "@/lib/drawings/prepare";
import { plural } from "@/lib/format";
import type { Level } from "@/types/models";

type Props = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a level to edit it; omit to add a new one. */
  level?: Level;
  /** How many snags sit on this level (shown before deleting). */
  snagCount?: number;
  onCreated?: (level: Level) => void;
  onDeleted?: () => void;
};

export function LevelFormDialog({ open, onOpenChange, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <LevelForm {...rest} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function progressLabel(p: DrawingProgress): string {
  if (p.stage === "preparing") return "Preparing drawing…";
  if (p.stage === "uploading") return `Uploading ${Math.round(p.fraction * 100)}%`;
  return "Saving…";
}

function LevelForm({ projectId, level, snagCount = 0, onCreated, onDeleted, onDone }: Omit<Props, "open" | "onOpenChange"> & { onDone: () => void }) {
  const isEdit = !!level;
  const createLevel = useCreateLevel(projectId);
  const updateLevel = useUpdateLevel(projectId);
  const deleteLevel = useDeleteLevel(projectId);
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(level?.name ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState<DrawingProgress | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = !!progress || deleteLevel.isPending;

  async function chooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    e.target.value = "";
    setFile(chosen);
    setPage(1);
    setPages(1);
    if (chosen && isPdf(chosen)) {
      try {
        setPages(await countPdfPages(chosen));
      } catch {
        setFile(null);
        toast.error("That PDF couldn't be read. Try another file, or export the sheet as an image.");
      }
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const drawing = file ? { file, pdfPage: page } : null;
    setProgress(drawing ? { stage: "preparing" } : { stage: "saving" });
    try {
      if (isEdit) {
        await updateLevel.mutateAsync({ level, name: name.trim(), drawing, onProgress: setProgress });
        toast.success(drawing ? "Drawing updated" : "Level updated");
      } else {
        const created = await createLevel.mutateAsync({ name: name.trim(), drawing, onProgress: setProgress });
        toast.success("Level added");
        onCreated?.(created);
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the level");
    } finally {
      setProgress(null);
    }
  }

  async function remove() {
    if (!level) return;
    try {
      await deleteLevel.mutateAsync(level.id);
      toast.success(`Deleted “${level.name}”`);
      onDeleted?.();
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the level");
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit level" : "Add level"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Rename the level or upload a newer drawing. Pins stay where they are."
            : "A floor or area of the project, with its drawing."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="level-name">Name</Label>
        <Input
          id="level-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ground floor"
          maxLength={100}
          required
          autoFocus={!isEdit}
          disabled={busy}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="level-drawing">{isEdit && level.drawing_url ? "Replace drawing" : "Drawing"}</Label>
        <input
          ref={fileInput}
          id="level-drawing"
          type="file"
          accept="application/pdf,image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={chooseFile}
          data-testid="drawing-input"
        />
        <Button type="button" variant="outline" size="lg" onClick={() => fileInput.current?.click()} disabled={busy} className="justify-start">
          <FileUp />
          <span className="truncate">{file ? file.name : "Choose a PDF or image"}</span>
        </Button>
        {pages > 1 && (
          <div className="grid gap-2">
            <Label htmlFor="level-page">This PDF has {pages} pages. Use page</Label>
            <NativeSelect id="level-page" value={page} onChange={(e) => setPage(Number(e.target.value))} disabled={busy}>
              {Array.from({ length: pages }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Page {i + 1}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        {!file && (
          <p className="text-muted-foreground text-xs">
            {isEdit && level.drawing_url ? "Leave empty to keep the current drawing." : "Optional. You can add the drawing later."}
          </p>
        )}
      </div>

      {isEdit && confirmDelete && (
        <div className="border-destructive/30 bg-destructive/5 grid gap-3 rounded-xl border p-3 text-sm" role="alert">
          <p>
            Delete “{level.name}” and its drawing?{" "}
            {snagCount > 0
              ? `Its ${plural(snagCount, "issue")} will be kept, but will lose ${snagCount === 1 ? "its" : "their"} level and pin.`
              : "No issues are on this level."}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={busy}>
              Keep
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={busy}>
              {deleteLevel.isPending && <Loader2 className="animate-spin" />} Delete level
            </Button>
          </div>
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        {isEdit && !confirmDelete ? (
          <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)} disabled={busy}>
            <Trash2 /> Delete level
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" disabled={busy || !name.trim()}>
          {progress && <Loader2 className="animate-spin" />}
          <span aria-live="polite">{progress ? progressLabel(progress) : isEdit ? "Save changes" : "Add level"}</span>
        </Button>
      </DialogFooter>
    </form>
  );
}
