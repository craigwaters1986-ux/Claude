"use client";

import { useRef } from "react";
import { KeepScale, TransformComponent, TransformWrapper, useControls } from "react-zoom-pan-pinch";
import { MapPin, Maximize, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Level, SnagStatus } from "@/types/models";

export type PlanPin = {
  id: string;
  /** Fractions of the drawing's width / height (0–1). */
  x: number;
  y: number;
  /** Shown inside the pin, e.g. the snag number. */
  label: string;
  status: SnagStatus;
  title?: string;
};

const PIN_COLOUR: Record<SnagStatus, string> = {
  open: "bg-red-600",
  in_progress: "bg-amber-500",
  resolved: "bg-emerald-600",
};

type Props = {
  level: Pick<Level, "name" | "drawing_url" | "drawing_width" | "drawing_height">;
  pins?: PlanPin[];
  onPinClick?: (pin: PlanPin) => void;
  /** Placing mode: tapping the plan reports where, and `value` shows the pin being placed. */
  placing?: { value: { x: number; y: number } | null; onPlace: (x: number, y: number) => void };
  className?: string;
};

/**
 * A drawing you can pinch-zoom and pan, with snag pins on it.
 * Pins are positioned by fraction, so they sit on the same spot at any zoom,
 * and stay the same size on screen (they don't grow or shrink with the plan).
 * The counter-scaling must pivot on the pinned point (top-left of a zero-size
 * anchor); pivoting on the pin's own centre drifts it off its spot when zoomed.
 */
export function PlanViewer({ level, pins = [], onPinClick, placing, className }: Props) {
  const down = useRef<{ x: number; y: number } | null>(null);
  const width = level.drawing_width ?? 4;
  const height = level.drawing_height ?? 3;

  // A tap places the pin; a drag pans. Tell them apart by how far the finger moved.
  function onPointerDown(e: React.PointerEvent) {
    down.current = { x: e.clientX, y: e.clientY };
  }
  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!placing) return;
    const start = down.current;
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) return;
    const rect = e.currentTarget.getBoundingClientRect(); // includes the current zoom and pan
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) placing.onPlace(x, y);
  }

  return (
    <div className={cn("bg-muted relative overflow-hidden rounded-xl border", className)} data-testid="plan-viewer">
      <TransformWrapper minScale={1} maxScale={10} centerOnInit doubleClick={{ disabled: !!placing }} wheel={{ step: 0.15 }}>
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
          {/* A sized container, so the drawing can be "as large as fits" at its own proportions. */}
          <div className="flex size-full items-center justify-center [container-type:size]">
            {/* Pins are placed inside this box, which is exactly the drawing. */}
            <div
              className={cn("relative", placing && "cursor-crosshair")}
              style={{ aspectRatio: `${width} / ${height}`, width: `min(100cqw, ${(width / height) * 100}cqh)` }}
              onPointerDown={onPointerDown}
              onClick={onClick}
              data-testid="plan-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={level.drawing_url ?? ""}
                alt={`Drawing of ${level.name}`}
                className="size-full bg-white object-contain select-none"
                draggable={false}
              />
              {pins.map((pin) => (
                <div key={pin.id} className="absolute size-0" style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}>
                  {/* Counter-scaled around the pinned point itself, so the pin stays on its spot at any zoom. */}
                  <KeepScale className="origin-top-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPinClick?.(pin);
                      }}
                      disabled={!onPinClick}
                      title={pin.title}
                      aria-label={`Snag ${pin.label}${pin.title ? `: ${pin.title}` : ""}`}
                      className={cn(
                        "flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-black/40",
                        PIN_COLOUR[pin.status],
                        onPinClick && "cursor-pointer transition-transform hover:scale-110",
                      )}
                      data-testid="plan-pin"
                    >
                      {pin.label}
                    </button>
                  </KeepScale>
                </div>
              ))}
              {placing?.value && (
                <div
                  className="pointer-events-none absolute size-0"
                  style={{ left: `${placing.value.x * 100}%`, top: `${placing.value.y * 100}%` }}
                  data-testid="placing-pin"
                >
                  <KeepScale className="origin-top-left">
                    {/* A map pin whose point marks the spot, so it shows above the fingertip instead of under it. */}
                    <div className="relative">
                      <MapPin
                        className="fill-brand absolute bottom-0 left-0 size-10 -translate-x-1/2 translate-y-[2px] text-black drop-shadow-md"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <div
                        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black"
                        data-testid="placing-dot"
                      />
                    </div>
                  </KeepScale>
                </div>
              )}
            </div>
          </div>
        </TransformComponent>
        <ZoomButtons />
      </TransformWrapper>
    </div>
  );
}

function ZoomButtons() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const button =
    "bg-card flex size-9 items-center justify-center border-b last:border-b-0 hover:bg-accent outline-none focus-visible:bg-accent";
  return (
    <div className="absolute right-2 bottom-2 flex flex-col overflow-hidden rounded-lg border shadow-md">
      <button type="button" className={button} onClick={() => zoomIn()} aria-label="Zoom in">
        <Plus className="size-4" />
      </button>
      <button type="button" className={button} onClick={() => zoomOut()} aria-label="Zoom out">
        <Minus className="size-4" />
      </button>
      <button type="button" className={button} onClick={() => resetTransform()} aria-label="Fit plan to view">
        <Maximize className="size-4" />
      </button>
    </div>
  );
}
