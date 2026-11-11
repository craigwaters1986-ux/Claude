import type { TypedSupabaseClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image/compress";
import { getProject } from "@/lib/services/projects";
import { listLevels } from "@/lib/services/levels";
import { listSnags } from "@/lib/services/snags";
import type { SnagPhoto } from "@/types/models";
import { filterSnags, photoSizeFor, type ReportOptions } from "./report-options";

export type ReportProgress =
  | { stage: "loading" }
  | { stage: "photos"; done: number; total: number }
  | { stage: "rendering" };

export type GeneratedReport = {
  blob: Blob;
  filename: string;
  snagCount: number;
  /** Photos that couldn't be included (failed to download or unsupported format). */
  missingPhotos: number;
};

const PARALLEL_DOWNLOADS = 4;
/** Size of the smaller extra photos under each card in the photo report. */
const EXTRA_PHOTO_PX = 480;
/** Size of a drawing on a plan page: sharp enough to read when printed at A4. */
const PLAN_PX = 2200;

/**
 * Build the PDF report for a project.
 *
 * 1. Reads the project and its snags fresh from the database, so the report
 *    never shows stale or still-saving data.
 * 2. Downloads the photos of the snags the options include, sized for the
 *    design (small for the table, larger for the photo report, none for the
 *    checklist). Embedding full-size photos would make a 60-snag report
 *    ~20 MB; sized copies keep it small enough to email. It also converts any
 *    format the PDF engine can't read (WebP) to JPEG.
 * 3. Lays out the PDF in the browser. Nothing is sent to a server.
 */
export async function generateSnagReport(
  supabase: TypedSupabaseClient,
  projectId: string,
  options: ReportOptions,
  onProgress?: (progress: ReportProgress) => void,
): Promise<GeneratedReport> {
  onProgress?.({ stage: "loading" });
  const [project, snags, levels] = await Promise.all([
    getProject(supabase, projectId),
    listSnags(supabase, projectId),
    listLevels(supabase, projectId),
  ]);
  const included = filterSnags(snags, options);
  const photoSize = photoSizeFor(options.design);

  // Which photos the design shows, and at what size: the table shows each
  // snag's cover; the photo report shows the cover large and the rest smaller.
  const wanted: { photo: SnagPhoto; size: number }[] = !photoSize
    ? []
    : included.flatMap((snag) =>
        options.design === "photos"
          ? snag.photos.map((photo, i) => ({ photo, size: i === 0 ? photoSize : EXTRA_PHOTO_PX }))
          : snag.photos.slice(0, 1).map((photo) => ({ photo, size: photoSize })),
      );

  // Drawings for the marked-up plan pages: levels with at least one pinned snag in this report.
  const planLevels = options.includePlans
    ? levels.filter((l) => l.drawing_url && included.some((s) => s.level_id === l.id && s.pin_x != null))
    : [];
  const plans: Record<string, string> = {}; // level id → data URL

  const thumbnails: Record<string, string> = {}; // photo id → data URL
  let done = 0;
  const total = wanted.length + planLevels.length;
  onProgress?.({ stage: "photos", done, total });

  await runInParallel(planLevels, 2, async (level) => {
    const dataUrl = await makeThumbnail(level.drawing_url!, PLAN_PX, 0.85);
    if (dataUrl) plans[level.id] = dataUrl;
    onProgress?.({ stage: "photos", done: ++done, total });
  });

  await runInParallel(wanted, PARALLEL_DOWNLOADS, async ({ photo, size }) => {
    const dataUrl = await makeThumbnail(photo.image_url, size);
    if (dataUrl) thumbnails[photo.id] = dataUrl;
    onProgress?.({ stage: "photos", done: ++done, total });
  });

  onProgress?.({ stage: "rendering" });
  const generatedAt = new Date();
  const { renderSnagReport } = await import("./snag-report"); // loads the PDF engine on first use
  const blob = await renderSnagReport({ project, snags, levels, plans, thumbnails, generatedAt, options });

  const kind = { table: "snag-report", photos: "photo-report", checklist: "snag-checklist" }[options.design];
  const who = options.assignees.length === 1 ? `-${slugify(options.assignees[0])}` : "";
  return {
    blob,
    filename: `${kind}-${slugify(project.name)}${who}-${isoDate(generatedAt)}.pdf`,
    snagCount: included.length,
    missingPhotos: total - Object.keys(thumbnails).length - Object.keys(plans).length,
  };
}

/** One broken photo must not sink the whole report, so failures return null. */
async function makeThumbnail(url: string, maxDimension: number, quality?: number): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const small = await compressImage(await response.blob(), { maxDimension, quality: quality ?? (maxDimension > 500 ? 0.8 : 0.75) });
    // The PDF engine only reads JPEG and PNG. (An undecodable HEIC comes back unchanged.)
    if (small.type !== "image/jpeg" && small.type !== "image/png") return null;
    return await blobToDataUrl(small);
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Run `task` over `items`, at most `limit` at a time. */
async function runInParallel<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await task(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}

function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Save a Blob to the device (opens the PDF viewer / share sheet on phones). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
