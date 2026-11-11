"use client";

import { ChevronDown, ImageOff, Images, Loader2, MapPin, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SNAG_STATUS_CLASS } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { SNAG_STATUS_LABEL, SNAG_STATUSES, type ListedSnag, type SnagStatus } from "@/types/models";

type Props = {
  snag: ListedSnag;
  /** Name of the snag's level, if it has one. */
  levelName?: string;
  onOpen: () => void;
  onStatusChange: (status: SnagStatus) => void;
  onDelete: () => void;
};

export function SnagCard({ snag, levelName, onOpen, onStatusChange, onDelete }: Props) {
  const cover = snag.photos[0]?.image_url ?? snag.image_url;
  const label = snag._pending ? snag.title : `snag ${snag.snag_number}, ${snag.title}`;
  return (
    <div className={cn("surface flex gap-3 p-3", snag._pending && "opacity-70")}>
      <button
        type="button"
        onClick={onOpen}
        disabled={snag._pending}
        className="bg-muted focus-visible:ring-ring/50 relative size-20 shrink-0 overflow-hidden rounded-xl outline-none focus-visible:ring-[3px] sm:size-24"
        aria-label={`Open ${label}${snag.photos.length ? ` (${snag.photos.length} photo${snag.photos.length === 1 ? "" : "s"})` : ""}`}
      >
        {cover ? (
          // Plain <img>: Supabase public URLs, lazy-loaded, no Next image config needed.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <ImageOff className="size-5" />
          </span>
        )}
        {snag.photos.length > 1 && (
          <span className="absolute right-1 bottom-1 inline-flex items-center gap-0.5 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white">
            <Images className="size-3" />
            {snag.photos.length}
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onOpen}
            disabled={snag._pending}
            className="focus-visible:ring-ring/50 min-w-0 rounded-sm text-left outline-none focus-visible:ring-[3px]"
          >
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
          </button>
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

        {snag.assigned_to && (
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-sm">
            <UserRound className="size-3.5 shrink-0" />
            <span className="truncate">{snag.assigned_to}</span>
          </p>
        )}
        {levelName && (
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-sm">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {levelName}
              {snag.pin_x == null && " (not pinned)"}
            </span>
          </p>
        )}
        {/* Only snags logged before the three-line form have a location. */}
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
