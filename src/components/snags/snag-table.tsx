"use client";

import { ChevronDown, CloudOff, ImageOff, Images, Loader2, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SNAG_STATUS_CLASS } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SNAG_STATUS_LABEL, SNAG_STATUSES, type ListedSnag, type SnagStatus } from "@/types/models";

type Props = {
  snags: ListedSnag[];
  levelNames: Map<string, string>;
  onOpen: (snag: ListedSnag) => void;
  onStatusChange: (snag: ListedSnag, status: SnagStatus) => void;
  onDelete: (snag: ListedSnag) => void;
};

/**
 * Laptop view of a project's snags: one row per snag, so a long list can be
 * scanned at a glance. Click a row to open the snag.
 */
export function SnagTable({ snags, levelNames, onOpen, onStatusChange, onDelete }: Props) {
  const showLevels = levelNames.size > 0;
  return (
    <div className="surface overflow-hidden">
      <table className="w-full text-sm" aria-label="Snags">
        <thead className="bg-muted/60 text-muted-foreground text-left text-xs font-medium">
          <tr>
            <th className="w-14 px-4 py-3">#</th>
            <th className="w-20 py-3">Photo</th>
            <th className="py-3 pr-4">Snag</th>
            <th className="w-36 py-3 pr-4">Assigned to</th>
            {showLevels && <th className="w-32 py-3 pr-4">Level</th>}
            <th className="w-32 py-3 pr-4">Status</th>
            <th className="hidden w-28 py-3 pr-4 xl:table-cell">Logged</th>
            <th className="w-12 py-3 pr-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {snags.map((snag) => {
            const cover = snag.photos[0]?.image_url ?? snag.image_url;
            return (
              <tr
                key={snag.id}
                onClick={() => !snag._pending && onOpen(snag)}
                className={cn(
                  "group cursor-pointer align-top transition-colors hover:bg-accent/60",
                  snag._pending && "cursor-default opacity-70",
                )}
                data-testid="snag-row"
              >
                <td className="px-4 py-3 font-semibold tabular-nums">
                  {snag._offline === "waiting" ? (
                    <CloudOff className="size-4 text-amber-600" aria-label="On this device, waiting for signal" />
                  ) : snag._pending ? (
                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                  ) : (
                    snag.snag_number
                  )}
                </td>
                <td className="py-2.5">
                  <div className="bg-muted relative size-12 overflow-hidden rounded-lg">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground flex size-full items-center justify-center">
                        <ImageOff className="size-4" />
                      </span>
                    )}
                    {snag.photos.length > 1 && (
                      <span className="absolute right-0.5 bottom-0.5 inline-flex items-center gap-0.5 rounded bg-black/65 px-1 text-[10px] font-medium text-white">
                        <Images className="size-2.5" />
                        {snag.photos.length}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {/* The real control for keyboard and screen-reader users; the row click is a convenience. */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(snag);
                    }}
                    disabled={snag._pending}
                    className="focus-visible:ring-ring/50 rounded-sm text-left font-medium outline-none group-hover:underline focus-visible:ring-[3px]"
                  >
                    {snag.title}
                  </button>
                  {snag.description && <p className="text-muted-foreground mt-0.5 line-clamp-2">{snag.description}</p>}
                </td>
                <td className="py-3 pr-4">{snag.assigned_to || <span className="text-muted-foreground">—</span>}</td>
                {showLevels && (
                  <td className="py-3 pr-4">
                    {snag.level_id && levelNames.get(snag.level_id) ? (
                      <span className="inline-flex items-center gap-1">
                        {snag.pin_x != null && <MapPin className="text-muted-foreground size-3.5 shrink-0" />}
                        {levelNames.get(snag.level_id)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                )}
                <td className="py-2.5 pr-4" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block">
                    <select
                      aria-label={`Status of snag ${snag._pending ? "(saving)" : `#${snag.snag_number}`}`}
                      value={snag.status}
                      onChange={(e) => onStatusChange(snag, e.target.value as SnagStatus)}
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
                </td>
                <td className="text-muted-foreground hidden py-3 pr-4 whitespace-nowrap xl:table-cell">{formatDate(snag.created_at)}</td>
                <td className="py-2 pr-3" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => onDelete(snag)}
                    disabled={snag._pending}
                    aria-label={`Delete snag ${snag.snag_number}`}
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
