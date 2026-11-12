"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOutbox } from "@/hooks/use-outbox";
import { plural } from "@/lib/format";
import { sync } from "@/lib/offline/outbox";
import { cn } from "@/lib/utils";

/**
 * Top-bar status: how many snags are saved on this device but not uploaded
 * yet. Hidden when everything is on the server and there's signal.
 */
export function SyncStatus() {
  const { entries, syncing, online } = useOutbox();
  const waiting = entries.filter((e) => e.state === "waiting").length;
  const failed = entries.filter((e) => e.state === "failed").length;
  if (online && !waiting && !failed) return null;

  const label = failed
    ? `${failed} not saved`
    : waiting
      ? `${waiting} to upload`
      : "No signal";

  function explain() {
    if (failed) {
      toast.error(`${plural(failed, "snag")} couldn’t be saved. Open Add snags on the project to retry or discard.`);
    } else if (waiting) {
      toast(
        online
          ? `${plural(waiting, "snag")} saved on this phone, uploading now.`
          : `${plural(waiting, "snag")} saved safely on this phone. They’ll upload by themselves when there’s signal.`,
      );
      if (online) void sync();
    } else {
      toast("No signal. You can keep logging snags; they’re saved on this phone and upload when the signal is back.");
    }
  }

  return (
    <button
      type="button"
      onClick={explain}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        failed ? "bg-red-500 text-white" : "bg-brand text-brand-foreground",
      )}
      aria-live="polite"
      data-testid="sync-status"
    >
      {syncing ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : online ? (
        <Cloud className="size-3.5" />
      ) : (
        <CloudOff className="size-3.5" />
      )}
      {label}
    </button>
  );
}
