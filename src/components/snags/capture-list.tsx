"use client";

import { onlineManager } from "@tanstack/react-query";
import { AlertCircle, Check, Clock, CloudOff, Loader2, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCaptureProgress } from "@/lib/capture-progress";
import { cn } from "@/lib/utils";
import type { Snag } from "@/types/models";
import type { SnagCapture } from "@/hooks/use-snags";

export type CaptureItem = {
  variables: SnagCapture;
  status: "idle" | "pending" | "success" | "error";
  isPaused: boolean;
  error: Error | null;
  data: Snag | undefined;
};

type Props = {
  items: CaptureItem[];
  onRetry: (item: CaptureItem) => void;
  onDiscard: (item: CaptureItem) => void;
};

/** "Logged this visit": live status of every snag captured in Rapid Entry. */
export function CaptureList({ items, onRetry, onDiscard }: Props) {
  if (items.length === 0) return null;
  return (
    <ul className="grid gap-2" aria-label="Snags logged this visit" aria-live="polite">
      {items.map((item) => (
        <CaptureRow key={item.variables.id} item={item} onRetry={onRetry} onDiscard={onDiscard} />
      ))}
    </ul>
  );
}

function CaptureRow({ item, onRetry, onDiscard }: { item: CaptureItem } & Omit<Props, "items">) {
  const progress = useCaptureProgress(item.variables.id);
  const thumb = item.data?.photos[0]?.image_url ?? item.variables.photos[0]?.previewUrl;
  const photoCount = item.variables.photos.length;
  const failed = item.status === "error";

  let statusText: React.ReactNode;
  if (item.status === "success") {
    statusText = (
      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
        <Check className="size-3.5" /> Saved as #{item.data?.snag_number}
      </span>
    );
  } else if (failed) {
    statusText = (
      <span className="text-destructive inline-flex items-center gap-1">
        <AlertCircle className="size-3.5 shrink-0" /> {item.error?.message ?? "Failed"}
      </span>
    );
  } else if (item.isPaused && onlineManager.isOnline()) {
    // Paused but online = waiting its turn behind earlier snags.
    statusText = (
      <span className="text-muted-foreground inline-flex items-center gap-1">
        <Clock className="size-3.5" /> Queued
      </span>
    );
  } else if (item.isPaused) {
    statusText = (
      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
        <CloudOff className="size-3.5" /> Waiting for signal…
      </span>
    );
  } else {
    const label =
      progress?.stage === "compressing"
        ? `Compressing photo${(progress.photos ?? 1) > 1 ? ` ${progress.photo} of ${progress.photos}` : ""}…`
        : progress?.stage === "uploading"
          ? `Uploading photo${(progress.photos ?? 1) > 1 ? ` ${progress.photo} of ${progress.photos}` : ""} ${Math.round((progress.fraction ?? 0) * 100)}%`
          : "Saving…";
    statusText = (
      <span className="text-muted-foreground inline-flex items-center gap-1">
        <Loader2 className="size-3.5 animate-spin" /> {label}
      </span>
    );
  }

  return (
    <li
      className={cn("surface flex items-center gap-3 rounded-xl p-2", failed && "border-destructive/40")}
      data-testid="capture-row"
      data-status={item.status}
    >
      <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {thumb && <img src={thumb} alt="" className="size-full object-cover" />}
        {photoCount > 1 && (
          <span className="absolute right-0.5 bottom-0.5 rounded bg-black/65 px-1 text-[10px] font-medium text-white">
            {photoCount}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.variables.title}</p>
        <p className="truncate text-xs">{statusText}</p>
        {progress?.stage === "uploading" && !failed && (
          <div className="bg-muted mt-1 h-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-[width]"
              style={{ width: `${Math.round((progress.fraction ?? 0) * 100)}%` }}
            />
          </div>
        )}
      </div>
      {failed && (
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant="outline" onClick={() => onRetry(item)} aria-label={`Retry ${item.variables.title}`}>
            <RotateCw />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDiscard(item)} aria-label={`Discard ${item.variables.title}`}>
            <X />
          </Button>
        </div>
      )}
    </li>
  );
}
