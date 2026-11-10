"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Camera, Images, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PhotoValue = { file: File; previewUrl: string } | null;

export type PhotoPickerHandle = { focus: () => void };

type Props = {
  value: PhotoValue;
  onChange: (value: PhotoValue) => void;
  disabled?: boolean;
};

/**
 * Big, glove-friendly photo area.
 * "Take photo" opens the rear camera directly (capture="environment");
 * "Gallery" opens the normal file picker for photos taken earlier.
 */
export const PhotoPicker = forwardRef<PhotoPickerHandle, Props>(function PhotoPicker(
  { value, onChange, disabled },
  ref,
) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraButton = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({ focus: () => cameraButton.current?.focus() }));

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (value) URL.revokeObjectURL(value.previewUrl);
    onChange({ file, previewUrl: URL.createObjectURL(file) });
  }

  function clear() {
    if (value) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
  }

  return (
    <div>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleFile}
        data-testid="camera-input"
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleFile}
        data-testid="gallery-input"
      />

      {value ? (
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.previewUrl} alt="Snag photo preview" className="size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
            <Button type="button" variant="secondary" onClick={() => cameraInput.current?.click()} disabled={disabled}>
              <RefreshCw /> Retake
            </Button>
            <Button type="button" variant="secondary" size="icon" onClick={clear} disabled={disabled} aria-label="Remove photo">
              <X />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid aspect-[4/3] grid-rows-[1fr_auto] gap-2 rounded-xl border-2 border-dashed p-2 sm:aspect-[16/7]">
          <button
            ref={cameraButton}
            type="button"
            onClick={() => cameraInput.current?.click()}
            disabled={disabled}
            className="bg-muted/50 hover:bg-muted focus-visible:ring-ring/50 flex flex-col items-center justify-center gap-2 rounded-lg outline-none focus-visible:ring-[3px]"
          >
            <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-full">
              <Camera className="size-7" />
            </span>
            <span className="font-medium">Take photo</span>
          </button>
          <Button type="button" variant="ghost" onClick={() => galleryInput.current?.click()} disabled={disabled}>
            <Images /> Choose from gallery
          </Button>
        </div>
      )}
    </div>
  );
});
