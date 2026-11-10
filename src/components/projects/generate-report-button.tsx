"use client";

import { useMemo, useState } from "react";
import { Check, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useSnags } from "@/hooks/use-snags";
import { useSupabase } from "@/hooks/use-supabase";
import { downloadBlob, generateSnagReport, type ReportProgress } from "@/lib/pdf/generate-report";
import {
  DESIGNS,
  GROUP_BY_OPTIONS,
  STATUS_FILTERS,
  filterSnags,
  listAssignees,
  loadRememberedOptions,
  rememberOptions,
  type GroupBy,
  type ReportDesign,
  type ReportOptions,
} from "@/lib/pdf/report-options";
import { cn } from "@/lib/utils";

function progressLabel(progress: ReportProgress): string {
  switch (progress.stage) {
    case "loading":
      return "Loading snags…";
    case "photos":
      return progress.total ? `Photos ${progress.done}/${progress.total}` : "Preparing…";
    case "rendering":
      return "Building PDF…";
  }
}

/** "Generate report" button: opens the report options, then builds the PDF. */
export function GenerateReportButton({ projectId, disabled }: { projectId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)} disabled={disabled}>
        <FileDown /> Generate report
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          {open && <ReportOptionsForm projectId={projectId} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportOptionsForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const supabase = useSupabase();
  const snags = useSnags(projectId);
  const [options, setOptions] = useState<ReportOptions>(loadRememberedOptions);
  const [progress, setProgress] = useState<ReportProgress | null>(null);

  const assignees = useMemo(() => listAssignees(snags.data ?? []), [snags.data]);
  const includedCount = useMemo(() => filterSnags(snags.data ?? [], options).length, [snags.data, options]);

  function set<K extends keyof ReportOptions>(key: K, value: ReportOptions[K]) {
    setOptions((o) => ({ ...o, [key]: value }));
  }

  function toggleAssignee(name: string) {
    setOptions((o) => ({
      ...o,
      assignees: o.assignees.includes(name) ? o.assignees.filter((a) => a !== name) : [...o.assignees, name],
    }));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const chosen = { ...options, preparedBy: options.preparedBy.trim(), preparedFor: options.preparedFor.trim() };
    rememberOptions(chosen);
    setProgress({ stage: "loading" });
    try {
      const report = await generateSnagReport(supabase, projectId, chosen, setProgress);
      downloadBlob(report.blob, report.filename);
      if (report.missingPhotos > 0) {
        toast.warning(
          `Report created, but ${report.missingPhotos} photo${report.missingPhotos === 1 ? "" : "s"} couldn’t be included.`,
        );
      } else {
        toast.success("Report downloaded");
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate the report");
    } finally {
      setProgress(null);
    }
  }

  const busy = !!progress;

  return (
    <form onSubmit={generate} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Generate report</DialogTitle>
        <DialogDescription>Choose a design and what to include.</DialogDescription>
      </DialogHeader>

      {/* Design */}
      <fieldset className="grid gap-2" disabled={busy}>
        <legend className="mb-2 text-sm font-medium">Design</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {DESIGNS.map((d) => (
            <label
              key={d.value}
              className={cn(
                "relative flex cursor-pointer gap-3 rounded-lg border p-2.5 transition-colors sm:flex-col sm:gap-2",
                "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]",
                options.design === d.value ? "border-primary bg-accent" : "hover:bg-accent/60",
              )}
            >
              <input
                type="radio"
                name="design"
                value={d.value}
                checked={options.design === d.value}
                onChange={() => set("design", d.value)}
                className="sr-only"
              />
              <DesignThumbnail design={d.value} />
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm font-medium">
                  {d.label}
                  {options.design === d.value && <Check className="size-3.5" />}
                </span>
                <span className="text-muted-foreground block text-xs">{d.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Which snags */}
      <fieldset className="grid gap-2" disabled={busy}>
        <legend className="mb-2 text-sm font-medium">Which snags</legend>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_FILTERS.map((f) => (
            <label
              key={f.value}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition-colors",
                "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]",
                options.status === f.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
              )}
            >
              <input
                type="radio"
                name="status"
                value={f.value}
                checked={options.status === f.value}
                onChange={() => set("status", f.value)}
                className="sr-only"
              />
              {f.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Assigned to */}
      {assignees.length > 1 && (
        <fieldset className="grid gap-2" disabled={busy}>
          <legend className="mb-2 text-sm font-medium">
            Assigned to{" "}
            <span className="text-muted-foreground font-normal">
              {options.assignees.length ? `(${options.assignees.length} selected)` : "(everyone)"}
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {assignees.map((name) => {
              const on = options.assignees.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAssignee(name)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-sm transition-colors",
                    on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
                  )}
                >
                  {on && <Check className="size-3.5" />}
                  {name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="report-group">Group by</Label>
          <NativeSelect
            id="report-group"
            value={options.groupBy}
            onChange={(e) => set("groupBy", e.target.value as GroupBy)}
            disabled={busy}
          >
            {GROUP_BY_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="report-for">Prepared for</Label>
          <Input
            id="report-for"
            value={options.preparedFor}
            onChange={(e) => set("preparedFor", e.target.value)}
            placeholder="Client (optional)"
            maxLength={120}
            disabled={busy}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="report-by">Prepared by</Label>
          <Input
            id="report-by"
            value={options.preparedBy}
            onChange={(e) => set("preparedBy", e.target.value)}
            placeholder="Your name (optional)"
            maxLength={120}
            autoComplete="name"
            disabled={busy}
          />
        </div>
      </div>

      <DialogFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-center text-sm sm:text-left" aria-live="polite">
          {snags.isPending
            ? "Counting snags…"
            : includedCount === 0
              ? "No snags match these options."
              : `${includedCount} ${includedCount === 1 ? "snag" : "snags"} will be included.`}
        </p>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy || snags.isPending || includedCount === 0}>
          {busy ? <Loader2 className="animate-spin" /> : <FileDown />}
          <span aria-live="polite">{progress ? progressLabel(progress) : "Generate PDF"}</span>
        </Button>
      </DialogFooter>
    </form>
  );
}

/** A tiny schematic of each design, so the choice is visual rather than just a name. */
function DesignThumbnail({ design }: { design: ReportDesign }) {
  const bar = "bg-foreground/15 rounded-[1px]";
  return (
    <div
      aria-hidden
      className="bg-background flex h-16 w-14 shrink-0 flex-col gap-[3px] rounded border p-1.5 shadow-xs sm:h-20 sm:w-full"
    >
      <div className="bg-foreground/70 h-[3px] w-1/2 rounded-[1px]" />
      <div className="mb-[2px] flex gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(bar, "h-[5px] flex-1")} />
        ))}
      </div>
      {design === "table" &&
        [0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-[3px]">
            <div className="h-[7px] w-[9px] rounded-[1px] bg-sky-300/70" />
            <div className={cn(bar, "h-[2px] flex-1")} />
            <div className="h-[3px] w-[6px] rounded-full bg-red-300" />
          </div>
        ))}
      {design === "photos" &&
        [0, 1].map((i) => (
          <div key={i} className="flex flex-1 gap-[3px]">
            <div className="w-1/2 rounded-[1px] bg-sky-300/70" />
            <div className="flex flex-1 flex-col gap-[2px] pt-[1px]">
              <div className={cn(bar, "h-[2px]")} />
              <div className={cn(bar, "h-[2px] w-2/3")} />
            </div>
          </div>
        ))}
      {design === "checklist" &&
        [0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-[3px]">
            <div className="border-foreground/50 size-[5px] rounded-[1px] border" />
            <div className={cn(bar, "h-[2px] flex-1")} />
          </div>
        ))}
    </div>
  );
}
