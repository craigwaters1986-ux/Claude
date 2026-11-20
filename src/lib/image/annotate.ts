/**
 * Photo mark-up: shapes drawn over a photo, then flattened into a new JPEG.
 *
 * Shapes are kept as data (in the photo's own pixel coordinates) while
 * editing, so undo is just "drop the last shape" and the screen can be
 * redrawn at any size. Saving draws the photo and the shapes onto one canvas.
 */

export type Point = { x: number; y: number };
export type Tool = "pen" | "arrow" | "circle" | "box" | "text";

export type Shape =
  | { kind: "pen"; color: string; points: Point[] }
  | { kind: "arrow" | "circle" | "box"; color: string; from: Point; to: Point }
  | { kind: "text"; color: string; at: Point; text: string };

export const MARKUP_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#facc15" },
  { name: "Blue", value: "#3b82f6" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#111111" },
] as const;

/** Largest edge used for editing and saving. Saved photos are 1920px, so this keeps full detail. */
export const MARKUP_MAX_EDGE = 2048;

/** Line width and text size scale with the photo, so marks look the same on any photo. */
export function markupSizes(width: number, height: number) {
  const edge = Math.max(width, height);
  return { line: Math.max(4, edge * 0.011), font: Math.max(18, edge * 0.05) };
}

/** Outline colour that keeps a mark visible on both light and dark parts of a photo. */
function haloFor(color: string) {
  return color === "#ffffff" || color === "#facc15" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)";
}

function strokePath(ctx: CanvasRenderingContext2D, color: string, line: number, trace: () => void) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // A thin halo underneath, then the colour on top.
  ctx.strokeStyle = haloFor(color);
  ctx.lineWidth = line * 1.6;
  ctx.beginPath();
  trace();
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = line;
  ctx.beginPath();
  trace();
  ctx.stroke();
}

/** Draw shapes onto a context whose coordinates are the photo's pixels. */
export function drawShapes(ctx: CanvasRenderingContext2D, shapes: Shape[], width: number, height: number) {
  const { line, font } = markupSizes(width, height);
  for (const s of shapes) {
    ctx.save();
    if (s.kind === "pen") {
      if (s.points.length === 1) {
        // A tap: a dot.
        const p = s.points[0];
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, line * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        strokePath(ctx, s.color, line, () => {
          ctx.moveTo(s.points[0].x, s.points[0].y);
          for (const p of s.points.slice(1)) ctx.lineTo(p.x, p.y);
        });
      }
    } else if (s.kind === "arrow") {
      const { from, to } = s;
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const head = line * 4.5;
      strokePath(ctx, s.color, line, () => {
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.moveTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(to.x, to.y);
        ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
      });
    } else if (s.kind === "circle") {
      const cx = (s.from.x + s.to.x) / 2;
      const cy = (s.from.y + s.to.y) / 2;
      const rx = Math.abs(s.to.x - s.from.x) / 2;
      const ry = Math.abs(s.to.y - s.from.y) / 2;
      strokePath(ctx, s.color, line, () => ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2));
    } else if (s.kind === "box") {
      const x = Math.min(s.from.x, s.to.x);
      const y = Math.min(s.from.y, s.to.y);
      strokePath(ctx, s.color, line, () => ctx.rect(x, y, Math.abs(s.to.x - s.from.x), Math.abs(s.to.y - s.from.y)));
    } else if (s.kind === "text") {
      ctx.font = `700 ${font}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.strokeStyle = haloFor(s.color);
      ctx.lineWidth = font * 0.18;
      ctx.strokeText(s.text, s.at.x, s.at.y);
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, s.at.x, s.at.y);
    }
    ctx.restore();
  }
}

/** Shapes too small to mean anything (a tap with the arrow tool, say) are ignored. */
export function isMeaningful(shape: Shape, width: number, height: number) {
  if (shape.kind === "pen" || shape.kind === "text") return true;
  const min = Math.max(width, height) * 0.015;
  return Math.hypot(shape.to.x - shape.from.x, shape.to.y - shape.from.y) >= min;
}

/** Load a photo (a local file or a saved photo's URL) sized for editing. */
export async function loadForMarkup(source: Blob | string): Promise<ImageBitmap> {
  const blob = typeof source === "string" ? await fetchImage(source) : source;
  const full = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const scale = Math.min(1, MARKUP_MAX_EDGE / Math.max(full.width, full.height));
  if (scale === 1) return full;
  const sized = await createImageBitmap(full, {
    resizeWidth: Math.round(full.width * scale),
    resizeHeight: Math.round(full.height * scale),
    resizeQuality: "high",
  });
  full.close();
  return sized;
}

async function fetchImage(url: string) {
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error(`Couldn’t load the photo (${res.status}).`);
  return res.blob();
}

/** The photo with its mark-up, as a JPEG. */
export async function flattenMarkup(image: ImageBitmap, shapes: Shape[], quality = 0.88): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This device can’t edit photos.");
  ctx.drawImage(image, 0, 0);
  drawShapes(ctx, shapes, image.width, image.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  canvas.width = canvas.height = 0; // free memory straight away (iOS)
  if (!blob) throw new Error("Couldn’t save the marked-up photo.");
  return blob;
}
