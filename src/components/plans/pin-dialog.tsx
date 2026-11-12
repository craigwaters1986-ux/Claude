"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Level } from "@/types/models";
import { PlanViewer } from "./plan-viewer";

type Pin = { x: number; y: number } | null;

/**
 * Full-size plan for placing (or removing) one snag's pin.
 * Full-size because a zoomable plan inside a scrolling form is awkward on a phone.
 */
export function PinDialog({
  level,
  open,
  onOpenChange,
  value,
  onSave,
}: {
  level: Level;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: Pin;
  onSave: (pin: Pin) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[92dvh] max-h-[92dvh] grid-rows-[auto_1fr_auto] gap-3 p-4 sm:max-w-5xl lg:p-6">
        {open && <PinPlacer level={level} value={value} onDone={(pin) => (onSave(pin), onOpenChange(false))} />}
      </DialogContent>
    </Dialog>
  );
}

function PinPlacer({ level, value, onDone }: { level: Level; value: Pin; onDone: (pin: Pin) => void }) {
  const [draft, setDraft] = useState<Pin>(value);
  return (
    <>
      <DialogHeader>
        <DialogTitle>{level.name}</DialogTitle>
        <DialogDescription>Tap the plan where the snag is. Pinch or scroll to zoom.</DialogDescription>
      </DialogHeader>
      <PlanViewer level={level} placing={{ value: draft, onPlace: (x, y) => setDraft({ x, y }) }} className="min-h-0" />
      <DialogFooter className="flex-row justify-between sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => onDone(null)} disabled={!value && !draft}>
          Remove pin
        </Button>
        <Button type="button" size="lg" disabled={!draft} onClick={() => onDone(draft)}>
          <MapPin /> Use this spot
        </Button>
      </DialogFooter>
    </>
  );
}
