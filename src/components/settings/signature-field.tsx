"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Loader2, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSupabase } from "@/hooks/use-supabase";
import { buildImagePath, getPublicImageUrl, removeImages, uploadImage } from "@/lib/services/storage";
import type { Settings } from "@/lib/settings/settings";
import { uuid } from "@/lib/uuid";

type Point = { x: number; y: number };

/** Settings → Reports → Signature: draw it once, printed on report cover pages. */
export function SignatureField({
  signatureUrl,
  signaturePath,
  onChange,
}: {
  signatureUrl: string | null;
  signaturePath: string | null;
  onChange: (patch: Partial<Settings>, message?: string) => Promise<void>;
}) {
  const supabase = useSupabase();
  const [drawing, setDrawing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(png: Blob) {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Please sign in again.");
      const path = buildImagePath(data.session.user.id, "branding", `signature-${uuid()}`, "image/png");
      await uploadImage(supabase, path, png);
      const old = signaturePath;
      await onChange({ signatureUrl: getPublicImageUrl(supabase, path), signaturePath: path }, "Signature saved");
      if (old) await removeImages(supabase, [old]);
      setDrawing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t save the signature");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const old = signaturePath;
    await onChange({ signatureUrl: null, signaturePath: null }, "Signature removed");
    if (old) await removeImages(supabase, [old]);
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-2">
      <span className="text-sm leading-none font-medium">Signature</span>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-lg border bg-white p-1.5">
          {signatureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signatureUrl} alt="Your signature" className="max-h-full max-w-full object-contain" data-testid="signature-preview" />
          ) : (
            <span className="text-xs text-neutral-400">No signature</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setDrawing(true)} disabled={busy}>
            <PenLine /> {signatureUrl ? "Redraw" : "Add signature"}
          </Button>
          {signatureUrl && (
            <Button type="button" variant="ghost" onClick={remove} disabled={busy} aria-label="Remove signature">
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">Printed on the cover page of reports, above your name and company.</p>

      <Dialog open={drawing} onOpenChange={(o) => !busy && setDrawing(o)}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          {drawing && <SignaturePad busy={busy} onCancel={() => setDrawing(false)} onSave={save} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SignaturePad({ busy, onCancel, onSave }: { busy: boolean; onCancel: () => void; onSave: (png: Blob) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const active = useRef<number | null>(null);
  const [hasInk, setHasInk] = useState(false);

  // Size the canvas to its box at the screen's pixel density, so lines are crisp.
  useEffect(() => {
    const c = canvas.current!;
    const resize = () => {
      const { width, height } = c.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function redraw() {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    drawStrokes(ctx, strokes.current, c.width / c.getBoundingClientRect().width || 1, "#111111");
  }

  function point(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle>Your signature</DialogTitle>
        <DialogDescription>Sign in the box with your finger or mouse.</DialogDescription>
      </DialogHeader>
      <div className="relative">
        <canvas
          ref={canvas}
          data-testid="signature-pad"
          aria-label="Signature pad"
          className="block h-44 w-full cursor-crosshair touch-none rounded-xl border-2 border-dashed bg-white"
          onPointerDown={(e) => {
            if (busy || active.current !== null) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            active.current = e.pointerId;
            strokes.current.push([point(e)]);
            setHasInk(true);
            redraw();
          }}
          onPointerMove={(e) => {
            if (active.current !== e.pointerId) return;
            strokes.current[strokes.current.length - 1].push(point(e));
            redraw();
          }}
          onPointerUp={(e) => {
            if (active.current === e.pointerId) active.current = null;
          }}
          onPointerCancel={(e) => {
            if (active.current === e.pointerId) active.current = null;
          }}
        />
        <div className="pointer-events-none absolute inset-x-6 bottom-9 border-b border-neutral-300" aria-hidden />
      </div>
      <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            strokes.current = [];
            setHasInk(false);
            redraw();
          }}
          disabled={!hasInk || busy}
        >
          <Eraser /> Clear
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!hasInk || busy}
            onClick={async () => {
              const png = await exportSignature(strokes.current);
              if (png) onSave(png);
            }}
          >
            {busy && <Loader2 className="animate-spin" />} Save signature
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

/** Smooth strokes through the points (midpoint curves), in CSS pixels scaled by `scale`. */
function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Point[][], scale: number, color: string) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    if (s.length === 1) {
      ctx.beginPath();
      ctx.arc(s[0].x, s[0].y, 1.4, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(s[0].x, s[0].y);
    for (let i = 1; i < s.length - 1; i++) {
      const mid = { x: (s[i].x + s[i + 1].x) / 2, y: (s[i].y + s[i + 1].y) / 2 };
      ctx.quadraticCurveTo(s[i].x, s[i].y, mid.x, mid.y);
    }
    const last = s[s.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
  ctx.restore();
}

/** The signature cropped to the ink, on a clear background, as a sharp PNG. */
async function exportSignature(strokes: Point[][]): Promise<Blob | null> {
  const pts = strokes.flat();
  if (!pts.length) return null;
  const pad = 6;
  const minX = Math.min(...pts.map((p) => p.x)) - pad;
  const minY = Math.min(...pts.map((p) => p.y)) - pad;
  const maxX = Math.max(...pts.map((p) => p.x)) + pad;
  const maxY = Math.max(...pts.map((p) => p.y)) + pad;
  const scale = 3; // print resolution
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round((maxX - minX) * scale));
  c.height = Math.max(1, Math.round((maxY - minY) * scale));
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.translate(-minX * scale, -minY * scale);
  drawStrokes(ctx, strokes, scale, "#14213d"); // dark ink blue
  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}
