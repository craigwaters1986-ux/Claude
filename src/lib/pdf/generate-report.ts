import type { TypedSupabaseClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image/compress";
import { getProject } from "@/lib/services/projects";
import { listSnags } from "@/lib/services/snags";
import type { Snag } from "@/types/models";

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

/** Print-quality at the size shown in the table (80pt ≈ 1.1in → ~290 dpi). */
const THUMBNAIL_PX = 320;
const PARALLEL_DOWNLOADS = 4;

/**
 * Build the PDF report for a project.
 *
 * 1. Reads the project and its snags fresh from the database, so the report
 *    never shows stale or still-saving data.
 * 2. Downloads each photo and shrinks it to a thumbnail. Embedding the
 *    full-size photos would make a 60-snag report ~20 MB; thumbnails keep it
 *    around 1 MB, small enough to email. It also converts any format the PDF
 *    engine can't read (WebP) to JPEG.
 * 3. Lays out the PDF in the browser. Nothing is sent to a server.
 */
export async function generateSnagReport(
  supabase: TypedSupabaseClient,
  projectId: string,
  onProgress?: (progress: ReportProgress) => void,
): Promise<GeneratedReport> {
  onProgress?.({ stage: "loading" });
  const [project, snags] = await Promise.all([getProject(supabase, projectId), listSnags(supabase, projectId)]);

  const withPhotos = snags.filter((s) => s.image_url);
  const thumbnails: Record<string, string> = {};
  let done = 0;
  onProgress?.({ stage: "photos", done, total: withPhotos.length });

  await runInParallel(withPhotos, PARALLEL_DOWNLOADS, async (snag) => {
    const dataUrl = await makeThumbnail(snag);
    if (dataUrl) thumbnails[snag.id] = dataUrl;
    onProgress?.({ stage: "photos", done: ++done, total: withPhotos.length });
  });

  onProgress?.({ stage: "rendering" });
  const generatedAt = new Date();
  const { renderSnagReport } = await import("./snag-report"); // loads the PDF engine on first use
  const blob = await renderSnagReport({ project, snags, thumbnails, generatedAt });

  return {
    blob,
    filename: `snag-report-${slugify(project.name)}-${isoDate(generatedAt)}.pdf`,
    snagCount: snags.length,
    missingPhotos: withPhotos.length - Object.keys(thumbnails).length,
  };
}

/** One broken photo must not sink the whole report, so failures return null. */
async function makeThumbnail(snag: Snag): Promise<string | null> {
  try {
    const response = await fetch(snag.image_url!);
    if (!response.ok) return null;
    const small = await compressImage(await response.blob(), { maxDimension: THUMBNAIL_PX, quality: 0.75 });
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
