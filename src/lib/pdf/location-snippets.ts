/**
 * Location snippets for reports: for each pinned snag, a small cut-out of its
 * level's drawing centred on the pin, with the pin marked. Made in the browser
 * from the stored drawing, once per level.
 */
import type { Level, Snag } from "@/types/models";

const SNIPPET_W = 480; // px; shown at ~120pt wide, so sharp when printed
const SNIPPET_H = 360; // 4:3
/** How much of the drawing a snippet shows: this fraction of the drawing's longer side. */
const WINDOW_FRACTION = 0.24;

const STATUS_COLOUR = { open: "#dc2626", in_progress: "#f59e0b", resolved: "#059669" } as const;

async function loadImage(url: string): Promise<ImageBitmap | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await createImageBitmap(await res.blob());
  } catch {
    return null;
  }
}

/** snag id → JPEG data URL, for every pinned snag whose level has a drawing. */
export async function makeLocationSnippets(snags: Snag[], levels: Level[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const byLevel = new Map<string, Snag[]>();
  for (const s of snags) {
    if (!s.level_id || s.pin_x == null || s.pin_y == null) continue;
    byLevel.set(s.level_id, [...(byLevel.get(s.level_id) ?? []), s]);
  }

  for (const [levelId, pinned] of byLevel) {
    const level = levels.find((l) => l.id === levelId);
    if (!level?.drawing_url) continue;
    const image = await loadImage(level.drawing_url);
    if (!image) continue;
    try {
      // A 4:3 window on the drawing, centred on the pin but kept inside the sheet.
      const winW = Math.min(image.width, Math.max(image.width, image.height) * WINDOW_FRACTION);
      const winH = Math.min(image.height, (winW * SNIPPET_H) / SNIPPET_W);
      const canvas = document.createElement("canvas");
      canvas.width = SNIPPET_W;
      canvas.height = SNIPPET_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      for (const snag of pinned) {
        const px = snag.pin_x! * image.width;
        const py = snag.pin_y! * image.height;
        const sx = Math.min(Math.max(0, px - winW / 2), image.width - winW);
        const sy = Math.min(Math.max(0, py - winH / 2), image.height - winH);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, SNIPPET_W, SNIPPET_H);
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, sx, sy, winW, winH, 0, 0, SNIPPET_W, SNIPPET_H);

        // The pin, where it falls in the window (off-centre near a sheet edge).
        const mx = ((px - sx) / winW) * SNIPPET_W;
        const my = ((py - sy) / winH) * SNIPPET_H;
        const colour = STATUS_COLOUR[snag.status];
        ctx.strokeStyle = colour;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(mx, my, 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(mx, my, 17, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Helvetica, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(snag.snag_number), mx, my + 1);

        // Level name, bottom-left
        const label = level.name;
        ctx.font = "bold 18px Helvetica, Arial, sans-serif";
        const w = ctx.measureText(label).width + 16;
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(8, SNIPPET_H - 36, w, 28);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText(label, 16, SNIPPET_H - 21);

        out[snag.id] = canvas.toDataURL("image/jpeg", 0.82);
      }
    } finally {
      image.close();
    }
  }
  return out;
}
