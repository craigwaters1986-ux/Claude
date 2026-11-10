"use client";

import { ChevronDown, ImageOff, Loader2, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SNAG_STATUS_CLASS } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { SNAG_STATUS_LABEL, SNAG_STATUSES, type ListedSnag, type SnagStatus } from "@/types/models";

type Props = {
  snag: ListedSnag;
  onStatusChange: (status: SnagStatus) => void;
  onDelete: () => void;
};

export function SnagCard({ snag, onStatusChange, onDelete }: Props) {
  return (
    <div className={cn("bg-card flex gap-3 rounded-xl border p-3 shadow-sm", snag._pending && "opacity-70")}>
      <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg sm:size-24">
        {snag.image_url ? (
          <a href={snag.image_url} target="_blank" rel="noreferrer" aria-label={`Open photo for snag ${snag.snag_number}`}>
            {/* Plain <img>: Supabase public URLs, lazy-loaded, no Next image config needed. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={snag.image_url} alt="" loading="lazy" className="size-full object-cover" />
          </a>
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <ImageOff className="size-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tabular-nums">
              {snag._pending ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" /> Saving…
                </span>
              ) : (
                `#${snag.snag_number}`
              )}
            </p>
            <h3 className="leading-snug font-medium break-words">{snag.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground -mt-1 -mr-1 shrink-0"
            onClick={onDelete}
            disabled={snag._pending}
            aria-label={`Delete snag ${snag.snag_number}`}
          >
            <Trash2 />
          </Button>
        </div>

        {snag.location_details && (
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-sm">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{snag.location_details}</span>
          </p>
        )}
        {snag.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{snag.description}</p>
        )}

        {/* Native select styled as a status pill: one tap opens the OS picker. */}
        <div className="relative mt-2 inline-block">
          <select
            aria-label={`Status of snag ${snag._pending ? "(saving)" : `#${snag.snag_number}`}`}
            value={snag.status}
            onChange={(e) => onStatusChange(e.target.value as SnagStatus)}
            disabled={snag._pending}
            className={cn(
              "h-8 cursor-pointer appearance-none rounded-md border-0 pr-7 pl-2.5 text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default",
              SNAG_STATUS_CLASS[snag.status],
            )}
          >
            {SNAG_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SNAG_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-70" />
        </div>
      </div>
    </div>
  );
}
