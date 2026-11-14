"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Circle, Loader2, Pencil, Square, Type, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  MARKUP_COLORS,
  drawShapes,
  flattenMarkup,
  isMeaningful,
  loadForMarkup,
  type Point,
  type Shape,
  type Tool,
} from "@/lib/image/annotate";
import { cn } from "@/lib/utils";

const TOOLS: { value: Tool; label: string; icon: typeof Pencil }[] = [
  { value: "pen", label: "Pen", icon: Pencil },
  { value: "arrow", label: "Arrow", icon: ArrowUpRight },
  { value: "circle", label: "Circle", icon: Circle },
  { value: "box", label: "Box", icon: Square },
  { value: "text", label: "Text", icon: Type },
];

const TOOL_KEY = "snaglist.markup-tool";

/**
 * Full-screen photo mark-up: draw with a finger (or mouse), then save a new
 * copy of the photo with the marks on it. Nothing changes until Save.
 */
export function AnnotateDialog({
  source,
  open,
  onOpenChange,
  onSave,
  title = "Mark up photo",
}: {
  /** The photo: a file on the device or a saved photo's URL. */
  source: Blob | string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the marked-up JPEG. May be async; the dialog waits, then closes. */
  onSave: (photo: Blob) => void | Promise<void>;
  title?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid h-[94dvh] max-h-[94dvh] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3 p-3 sm:max-w-5xl sm:p-5"
        // Drawing near the edge must not close the dialog.
        onInteractOutside={(e) => e.preventDefault()}
      >
        {open && source && <Editor source={source} title={title} onSave={onSave} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Editor({
  source,
  title,
  onSave,
  onDone,
}: {
  source: Blob | string;
  title: string;
  onSave: (photo: Blob) => void | Promise<void>;
  onDone: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [tool, setTool] = useState<Tool>(() => {
    try {
      const saved = localStorage.getItem(TOOL_KEY) as Tool | null;
      return TOOLS.some((t) => t.value === saved) ? saved! : "pen";
    } catch {
      return "pen";
    }
  });
  const [color, setColor] = useState<string>(MARKUP_COLORS[0].value);
  const [textAt, setTextAt] = useState<Point | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const drawing = useRef<number | null>(null); // active pointer id

  // Load the photo.
  useEffect(() => {
    let cancelled = false;
    let loaded: ImageBitmap | null = null;
    loadForMarkup(source).then(
      (bitmap) => {
        if (cancelled) return bitmap.close();
        loaded = bitmap;
        setImage(bitmap);
      },
      () => !cancelled && setLoadError("Couldn’t open this photo. Check your signal and try again."),
    );
    return () => {
      cancelled = true;
      loaded?.close();
    };
  }, [source]);

  // Redraw whenever the marks change.
  useLayoutEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !image) return;
    if (c.width !== image.width || c.height !== image.height) {
      c.width = image.width;
      c.height = image.height;
    }
    ctx.drawImage(image, 0, 0);
    drawShapes(ctx, draft ? [...shapes, draft] : shapes, image.width, image.height);
  }, [image, shapes, draft]);

  function chooseTool(next: Tool) {
    setTool(next);
    setTextAt(null);
    try {
      localStorage.setItem(TOOL_KEY, next);
    } catch {}
  }

  /** Screen position → photo pixel. */
  function toPhoto(e: React.PointerEvent): Point {
    const rect = canvas.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * image!.width,
      y: ((e.clientY - rect.top) / rect.height) * image!.height,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!image || saving || drawing.current !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    const p = toPhoto(e);
    if (tool === "text") {
      setTextAt(p);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = e.pointerId;
    setDraft(tool === "pen" ? { kind: "pen", color, points: [p] } : { kind: tool, color, from: p, to: p });
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (drawing.current !== e.pointerId || !draft) return;
    const p = toPhoto(e);
    setDraft((d) => (!d ? d : d.kind === "pen" ? { ...d, points: [...d.points, p] } : d.kind === "text" ? d : { ...d, to: p }));
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (drawing.current !== e.pointerId) return;
    drawing.current = null;
    if (draft && image && isMeaningful(draft, image.width, image.height)) setShapes((s) => [...s, draft]);
    setDraft(null);
  }

  function addText(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (value && textAt) setShapes((s) => [...s, { kind: "text", color, at: textAt, text: value }]);
    setText("");
    setTextAt(null);
  }

  async function save() {
    if (!image) return;
    if (!shapes.length) return onDone(); // nothing drawn: leave the photo as it is
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(await flattenMarkup(image, shapes));
      onDone();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn’t save the marked-up photo.");
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {tool === "text" ? "Tap the photo where the label should go." : "Draw on the photo with your finger or mouse."}
        </DialogDescription>
      </DialogHeader>

      {/* Tools and colours */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div role="radiogroup" aria-label="Tool" className="bg-muted flex rounded-lg p-0.5">
          {TOOLS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={tool === value}
              aria-label={label}
              title={label}
              onClick={() => chooseTool(value)}
              className={cn(
                "focus-visible:ring-ring/50 flex size-10 items-center justify-center rounded-md outline-none focus-visible:ring-[3px] sm:size-9",
                tool === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              <Icon className="size-[18px]" />
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Colour" className="flex items-center gap-1.5">
          {MARKUP_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={color === c.value}
              aria-label={c.name}
              title={c.name}
              onClick={() => setColor(c.value)}
              className={cn(
                "focus-visible:ring-ring/50 size-8 rounded-full border border-black/20 outline-none focus-visible:ring-[3px] dark:border-white/35",
                color === c.value && "ring-foreground ring-2 ring-offset-2 ring-offset-[var(--background)]",
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto h-10 sm:h-9"
          onClick={() => setShapes((s) => s.slice(0, -1))}
          disabled={!shapes.length || saving}
        >
          <Undo2 /> Undo
        </Button>
      </div>

      {/* The photo */}
      <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl bg-black">
        {image ? (
          <canvas
            ref={canvas}
            data-testid="markup-canvas"
            aria-label="Photo to mark up"
            className={cn("block max-h-full max-w-full touch-none select-none", tool === "text" ? "cursor-text" : "cursor-crosshair")}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        ) : loadError ? (
          <p className="px-6 text-center text-sm text-white/80" role="alert">
            {loadError}
          </p>
        ) : (
          <Loader2 className="size-6 animate-spin text-white/70" aria-label="Loading photo" />
        )}
      </div>

      {/* Footer: a text box while placing a label, otherwise Cancel / Save */}
      {textAt ? (
        <form onSubmit={addText} className="flex gap-2">
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Label, e.g. Crack"
            aria-label="Label text"
            maxLength={60}
            className="h-11 text-base"
          />
          <Button type="button" variant="ghost" className="h-11" onClick={() => (setTextAt(null), setText(""))}>
            Cancel
          </Button>
          <Button type="submit" className="h-11" disabled={!text.trim()}>
            Add
          </Button>
        </form>
      ) : (
        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          {saveError ? (
            <p className="text-destructive text-sm" role="alert">
              {saveError}
            </p>
          ) : (
            <span className="text-muted-foreground text-xs">{shapes.length ? `${shapes.length} mark${shapes.length === 1 ? "" : "s"}` : ""}</span>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="lg" onClick={onDone} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" size="lg" onClick={save} disabled={!image || saving || !shapes.length}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />} Save
            </Button>
          </div>
        </DialogFooter>
      )}
    </>
  );
}
