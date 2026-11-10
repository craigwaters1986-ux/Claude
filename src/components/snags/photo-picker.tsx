"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Camera, Images, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CapturePhoto } from "@/hooks/use-snags";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";
import { MAX_PHOTOS_PER_SNAG } from "@/types/models";

/** Turn picked files into photos with ids and local previews, up to `limit`. */
export function filesToPhotos(files: FileList | null, limit: number): { photos: CapturePhoto[]; skipped: number } {
  const all = [...(files ?? [])].filter((f) => f.type.startsWith("image/") || f.type === "");
  const kept = all.slice(0, Math.max(0, limit));
  return {
    photos: kept.map((file) => ({ id: uuid(), file, previewUrl: URL.createObjectURL(file) })),
    skipped: all.length - kept.length,
  };
}

export type PhotoInputsHandle = { openCamera: () => void; openGallery: () => void };

/**
 * The two hidden file inputs behind every "add photo" button.
 * Camera opens the rear camera directly (capture="environment") and takes one;
 * gallery opens the photo library and allows several at once.
 */
export const PhotoInputs = forwardRef<PhotoInputsHandle, { onFiles: (files: FileList | null) => void; testIdPrefix?: string }>(
  function PhotoInputs({ onFiles, testIdPrefix = "" }, ref) {
    const camera = useRef<HTMLInputElement>(null);
    const gallery = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => ({
      openCamera: () => camera.current?.click(),
      openGallery: () => gallery.current?.click(),
    }));

    function handle(e: React.ChangeEvent<HTMLInputElement>) {
      onFiles(e.target.files);
      e.target.value = ""; // allow picking the same file again
    }

    return (
      <>
        <input
          ref={camera}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={handle}
          data-testid={`${testIdPrefix}camera-input`}
        />
        <input
          ref={gallery}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={handle}
          data-testid={`${testIdPrefix}gallery-input`}
        />
      </>
    );
  },
);

export type PhotoPickerHandle = { focus: () => void; addFiles: (files: FileList | null) => void };

type Props = {
  value: CapturePhoto[];
  onChange: (value: CapturePhoto[]) => void;
  onLimitReached?: (skipped: number) => void;
};

/**
 * Glove-friendly photo area for a new snag: one big "Take photo" button to
 * start, then a grid of the photos taken so far with tiles to add more.
 * The first photo is the cover shown in lists.
 */
export const PhotoPicker = forwardRef<PhotoPickerHandle, Props>(function PhotoPicker({ value, onChange, onLimitReached }, ref) {
  const inputs = useRef<PhotoInputsHandle>(null);
  const cameraButton = useRef<HTMLButtonElement>(null);
  const remaining = MAX_PHOTOS_PER_SNAG - value.length;

  function add(files: FileList | null) {
    const { photos, skipped } = filesToPhotos(files, remaining);
    if (photos.length) onChange([...value, ...photos]);
    if (skipped) onLimitReached?.(skipped);
  }

  useImperativeHandle(ref, () => ({ focus: () => cameraButton.current?.focus(), addFiles: add }));

  function remove(id: string) {
    const photo = value.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    onChange(value.filter((p) => p.id !== id));
  }

  return (
    <div>
      <PhotoInputs ref={inputs} onFiles={add} />

      {value.length === 0 ? (
        <div className="bg-card grid aspect-[4/3] grid-rows-[1fr_auto] gap-2 rounded-2xl border-2 border-dashed p-2 sm:aspect-[16/7] lg:aspect-[4/3]">
          <button
            ref={cameraButton}
            type="button"
            onClick={() => inputs.current?.openCamera()}
            className="bg-muted/50 hover:bg-muted focus-visible:ring-ring/50 flex flex-col items-center justify-center gap-2 rounded-lg outline-none focus-visible:ring-[3px]"
          >
            <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-full">
              <Camera className="size-7" />
            </span>
            <span className="font-medium">Take photo</span>
            <span className="text-muted-foreground text-xs">Up to {MAX_PHOTOS_PER_SNAG} per snag<span className="hidden lg:inline"> · or drop photos here</span></span>
          </button>
          <Button type="button" variant="ghost" onClick={() => inputs.current?.openGallery()}>
            <Images /> Choose from gallery
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          <ul className="grid grid-cols-3 gap-2 lg:gap-3" aria-label="Photos for this snag">
            {value.map((photo, i) => (
              <li key={photo.id} className="bg-muted relative aspect-square overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(photo.id)}
                  className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-black/60 text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/70"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
            {remaining > 0 && (
              <>
                <li>
                  <AddTile ref={cameraButton} icon={Camera} label="Camera" onClick={() => inputs.current?.openCamera()} />
                </li>
                {value.length < MAX_PHOTOS_PER_SNAG - 1 && (
                  <li>
                    <AddTile icon={Images} label="Gallery" onClick={() => inputs.current?.openGallery()} />
                  </li>
                )}
              </>
            )}
          </ul>
          <p className="text-muted-foreground text-xs">
            {value.length} of {MAX_PHOTOS_PER_SNAG} photos
            {remaining === 0 ? " (maximum reached)" : ""}
          </p>
        </div>
      )}
    </div>
  );
});

const AddTile = forwardRef<
  HTMLButtonElement,
  { icon: typeof Camera; label: string; onClick: () => void; className?: string }
>(function AddTile({ icon: Icon, label, onClick, className }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "bg-card hover:bg-accent focus-visible:ring-ring/50 flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-sm font-medium outline-none focus-visible:ring-[3px]",
        className,
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
});
