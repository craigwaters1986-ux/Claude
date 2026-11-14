/**
 * Client-side photo compression using a canvas, no dependencies.
 *
 * Phone cameras produce 3–12 MB images. On a site with weak 4G that's a
 * 30-second upload per snag. Resizing to 1920px and re-encoding as JPEG
 * gives ~200–600 KB, plenty for a report thumbnail or zooming in on a crack.
 *
 * Done on the device, so nothing large ever leaves the phone.
 */

export type CompressOptions = {
  /** Longest edge in pixels. */
  maxDimension?: number;
  /** JPEG quality 0–1. */
  quality?: number;
};

/** Formats we can upload untouched if the browser can't decode them (e.g. HEIC on Android Chrome). */
const PASSTHROUGH_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_PASSTHROUGH_BYTES = 10 * 1024 * 1024; // matches the bucket's file_size_limit

export class UnsupportedImageError extends Error {
  constructor() {
    super("This photo format isn't supported. Take the photo with the camera, or choose a JPEG.");
    this.name = "UnsupportedImageError";
  }
}

export async function compressImage(file: Blob, options: CompressOptions = {}): Promise<Blob> {
  const { maxDimension = 1920, quality = 0.8 } = options;

  const source = await decode(file);
  if (!source) {
    // Browser can't read it, so upload the original if the server will accept it.
    if (PASSTHROUGH_TYPES.has(file.type) && file.size <= MAX_PASSTHROUGH_BYTES) return file;
    throw new UnsupportedImageError();
  }

  try {
    const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
    const width = Math.round(source.width * scale);
    const height = Math.round(source.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // JPEG has no transparency, so paint white first (otherwise PNG cut-outs go black).
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source.image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;

    // Already small and not resized? Keep whichever is smaller.
    return scale === 1 && file.type === "image/jpeg" && file.size <= blob.size ? file : blob;
  } finally {
    source.release();
  }
}

type Decoded = {
  image: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

/**
 * Decode with EXIF rotation applied, so portrait phone photos aren't
 * saved sideways. Returns null if the browser can't decode the format.
 */
async function decode(file: Blob): Promise<Decoded | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // fall through to <img>; some older Safari versions reject the options object
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode(); // modern browsers apply EXIF orientation to <img> by default
    return {
      image: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}
