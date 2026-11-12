"use client";

import { AlertCircle, Check, Clock, CloudOff, Loader2, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCaptureProgress } from "@/lib/capture-progress";
import { cn } from "@/lib/utils";

/** One snag logged this visit: still on the device, or already on the server. */
export type CaptureItem = {
  id: string;
  title: string;
  photoCount: number;
  thumb: string | null;
  /** pending = on this device, still to upload · success = on the server · error = refused, needs you */
  status: "pending" | "success" | "error";
  /** Why a pending snag isn't uploading this second. */
  waiting?: "offline" | "retrying" | "queued" | "uploading";
  error?: string;
  snagNumber?: number;
};

type Props = {
  items: CaptureItem[];
  onRetry: (item: CaptureItem) => void;
  onDiscard: (item: CaptureItem) => void;
};

/** "Logged this visit": the live state of every snag captured in Rapid Entry. */
export function CaptureList({ items, onRetry, onDiscard }: Props) {
  if (items.length === 0) return null;
  return (
    <ul className="grid grid-cols-1 gap-2" aria-label="Snags logged this visit" aria-live="polite">
      {items.map((item) => (
        <CaptureRow key={item.id} item={item} onRetry={onRetry} onDiscard={onDiscard} />
      ))}
    </ul>
  );
}

function CaptureRow({ item, onRetry, onDiscard }: { item: CaptureItem } & Omit<Props, "items">) {
  const progress = useCaptureProgress(item.id);
  const failed = item.status === "error";
  const pending = item.status === "pending";

  let statusText: React.ReactNode;
  if (item.status === "success") {
    statusText = (
      <span className="inline-flex items-start gap-1 text-emerald-700 dark:text-emerald-400">
        <Check className="size-3.5" /> Saved as #{item.snagNumber}
      </span>
    );
  } else if (failed) {
    statusText = (
      <span className="text-destructive inline-flex items-start gap-1">
        <AlertCircle className="size-3.5 shrink-0" /> {item.error ?? "Couldn’t be saved"}
      </span>
    );
  } else if (progress) {
    const n = (progress.photos ?? 1) > 1 ? ` ${progress.photo} of ${progress.photos}` : "";
    const label =
      progress.stage === "compressing"
        ? `Compressing photo${n}…`
        : progress.stage === "uploading"
          ? `Uploading photo${n} ${Math.round((progress.fraction ?? 0) * 100)}%`
          : "Saving…";
    statusText = (
      <span className="text-muted-foreground inline-flex items-start gap-1">
        <Loader2 className="size-3.5 animate-spin" /> {label}
      </span>
    );
  } else if (item.waiting === "offline" || item.waiting === "retrying") {
    statusText = (
      <span className="inline-flex items-start gap-1 text-amber-700 dark:text-amber-400">
        <CloudOff className="mt-px size-3.5 shrink-0" /> Saved on this phone · uploads when there’s signal
      </span>
    );
  } else {
    statusText = (
      <span className="text-muted-foreground inline-flex items-start gap-1">
        <Clock className="mt-px size-3.5 shrink-0" /> Saved on this phone · queued to upload
      </span>
    );
  }

  return (
    <li
      className={cn("surface flex min-w-0 items-center gap-3 rounded-xl p-2", failed && "border-destructive/40")}
      data-testid="capture-row"
      data-status={item.status}
      data-waiting={pending ? (item.waiting ?? "") : ""}
    >
      <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.thumb && <img src={item.thumb} alt="" className="size-full object-cover" />}
        {item.photoCount > 1 && (
          <span className="absolute right-0.5 bottom-0.5 rounded bg-black/65 px-1 text-[10px] font-medium text-white">
            {item.photoCount}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        {/* Wraps rather than truncating: these messages matter, and must never widen the page. */}
        <p className="text-xs break-words">{statusText}</p>
        {progress?.stage === "uploading" && pending && (
          <div className="bg-muted mt-1 h-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-[width]"
              style={{ width: `${Math.round((progress.fraction ?? 0) * 100)}%` }}
            />
          </div>
        )}
      </div>
      {(failed || (pending && item.waiting === "retrying")) && (
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant="outline" onClick={() => onRetry(item)} aria-label={`Retry ${item.title}`}>
            <RotateCw />
          </Button>
          {failed && (
            <Button size="icon" variant="ghost" onClick={() => onDiscard(item)} aria-label={`Discard ${item.title}`}>
              <X />
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
