"use client";

import { useState } from "react";
import { MapPin, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Level, SnagLocation } from "@/types/models";
import { PinDialog } from "./pin-dialog";

type Props = {
  levels: Level[];
  value: SnagLocation;
  onChange: (value: SnagLocation) => void;
  disabled?: boolean;
};

/**
 * Choose a snag's level and, if the level has a drawing, pin the exact spot.
 * Pinning opens the plan full-size, because a zoomable plan inside a
 * scrolling form is awkward to use on a phone.
 */
export function LocationPicker({ levels, value, onChange, disabled }: Props) {
  const [pinning, setPinning] = useState(false);
  const level = levels.find((l) => l.id === value.level_id);
  const hasPin = value.pin_x != null && value.pin_y != null;

  function selectLevel(levelId: string | null) {
    if (levelId === value.level_id) return;
    onChange({ level_id: levelId, pin_x: null, pin_y: null }); // a pin belongs to one drawing
  }

  function openPinning() {
    setPinning(true);
  }

  if (levels.length === 0) return null;

  return (
    <div className="grid gap-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Level">
        {[{ id: null as string | null, name: "No level" }, ...levels].map((l) => {
          const active = (value.level_id ?? null) === l.id;
          return (
            <button
              key={l.id ?? "none"}
              type="button"
              aria-pressed={active}
              onClick={() => selectLevel(l.id)}
              disabled={disabled}
              className={cn(
                "h-8 shrink-0 rounded-full border px-3 text-sm transition-colors",
                active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent",
              )}
            >
              {l.name}
            </button>
          );
        })}
      </div>

      {level?.drawing_url && (
        <button
          type="button"
          onClick={openPinning}
          disabled={disabled}
          className="bg-card hover:bg-accent/50 focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl border p-2 text-left outline-none focus-visible:ring-[3px]"
          data-testid="pin-button"
        >
          {/* Small preview of the drawing with the pin on it */}
          <span
            className="relative block h-16 shrink-0 overflow-hidden rounded-lg border bg-white"
            style={{ aspectRatio: `${level.drawing_width ?? 4} / ${level.drawing_height ?? 3}`, maxWidth: "7rem" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={level.drawing_url} alt="" className="size-full object-cover" />
            {hasPin && (
              <span
                className="bg-brand absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black"
                style={{ left: `${value.pin_x! * 100}%`, top: `${value.pin_y! * 100}%` }}
              />
            )}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {hasPin ? <MapPin className="size-4" /> : <MapPinOff className="text-muted-foreground size-4" />}
              {hasPin ? "Pinned on the plan" : "Pin on the plan"}
            </span>
            <span className="text-muted-foreground block text-xs">
              {hasPin ? "Tap to move the pin" : `Tap to mark where it is on ${level.name}`}
            </span>
          </span>
        </button>
      )}

      {level?.drawing_url && (
        <PinDialog
          level={level}
          open={pinning}
          onOpenChange={setPinning}
          value={hasPin ? { x: value.pin_x!, y: value.pin_y! } : null}
          onSave={(pin) => onChange({ level_id: level.id, pin_x: pin?.x ?? null, pin_y: pin?.y ?? null })}
        />
      )}
    </div>
  );
}
