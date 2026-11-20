/**
 * Turn an uploaded drawing (PDF or image) into one image that snags can be
 * pinned on. Done in the browser, like photo compression.
 *
 * Why an image: pins are stored as fractions of the drawing's width and
 * height, so the drawing must be a fixed picture. An image also zooms and
 * pans smoothly on a phone, where rendering a PDF live is slow.
 */
import { compressImage } from "@/lib/image/compress";

/** Longest edge of the stored drawing. Enough to read room names when zoomed in on an A1 sheet. */
const DRAWING_MAX_PX = 3200;
const DRAWING_QUALITY = 0.9;

export type PreparedDrawing = { blob: Blob; width: number; height: number };

export function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function loadPdf(file: File) {
  const pdfjs = await import("pdfjs-dist"); // large: only loaded when a PDF is chosen
  // The PDF engine runs in a worker so the page stays responsive while it renders.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  return { pdf: await task.promise, close: () => task.destroy() };
}

/** Number of pages in a PDF (drawing sets often have one sheet per page). */
export async function countPdfPages(file: File): Promise<number> {
  const { pdf, close } = await loadPdf(file);
  try {
    return pdf.numPages;
  } finally {
    await close();
  }
}

export async function prepareDrawing(file: File, pdfPage = 1): Promise<PreparedDrawing> {
  if (isPdf(file)) return renderPdfPage(file, pdfPage);

  const blob = await compressImage(file, { maxDimension: DRAWING_MAX_PX, quality: DRAWING_QUALITY });
  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) throw new Error("This file can't be read as a drawing. Use a PDF, JPEG or PNG.");
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return { blob, ...size };
}

async function renderPdfPage(file: File, pageNumber: number): Promise<PreparedDrawing> {
  const { pdf, close } = await loadPdf(file);
  try {
    const page = await pdf.getPage(Math.min(Math.max(1, pageNumber), pdf.numPages));
    const natural = page.getViewport({ scale: 1 });
    const scale = DRAWING_MAX_PX / Math.max(natural.width, natural.height);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare the drawing on this device.");
    ctx.fillStyle = "#fff"; // PDFs are transparent where nothing is drawn
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", DRAWING_QUALITY));
    if (!blob) throw new Error("Could not prepare the drawing on this device.");
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    await close();
  }
}
