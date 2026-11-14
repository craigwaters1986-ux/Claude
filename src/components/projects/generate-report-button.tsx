"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Download, FileDown, FileSpreadsheet, Loader2, Share2 } from "lucide-react";
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
import { useLevels } from "@/hooks/use-levels";
import { useProject } from "@/hooks/use-projects";
import { useSettings } from "@/hooks/use-settings";
import { useSnags } from "@/hooks/use-snags";
import { useSupabase } from "@/hooks/use-supabase";
import { downloadBlob, generateSnagReport, type ReportProgress } from "@/lib/pdf/generate-report";
import { buildIssuesCsv } from "@/lib/pdf/csv";
import {
  DESIGNS,
  GROUP_BY_OPTIONS,
  REPORT_TITLE_SUGGESTIONS,
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
      return "Loading issues…";
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
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          {open && <ReportFlow projectId={projectId} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

type Ready = { blob: Blob; filename: string; kind: "pdf" | "csv"; note?: string };

/** Options first, then a "ready" step to share or save the file. */
function ReportFlow({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [ready, setReady] = useState<Ready | null>(null);
  return ready ? (
    <ReportReady ready={ready} onBack={() => setReady(null)} onDone={onDone} />
  ) : (
    <ReportOptionsForm projectId={projectId} onReady={setReady} />
  );
}

function ReportOptionsForm({ projectId, onReady }: { projectId: string; onReady: (ready: Ready) => void }) {
  const supabase = useSupabase();
  const snags = useSnags(projectId);
  const levels = useLevels(projectId);
  const project = useProject(projectId);
  const hasLevels = (levels.data?.length ?? 0) > 0;
  const hasPlans = (levels.data ?? []).some((l) => l.drawing_url);
  const { settings } = useSettings();
  // "Prepared by" defaults to the name in Settings → Reports.
  const [chosen, setOptions] = useState<ReportOptions>(() => {
    const remembered = loadRememberedOptions();
    return remembered.preparedBy ? remembered : { ...remembered, preparedBy: settings.preparedBy };
  });
  // "By level" may be remembered from another project; ignore it where there are no levels.
  const levelCount = levels.data?.length ?? 0;
  const options = useMemo<ReportOptions>(
    () => (chosen.groupBy === "level" && levelCount === 0 ? { ...chosen, groupBy: "none" } : chosen),
    [chosen, levelCount],
  );
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
      onReady({
        blob: report.blob,
        filename: report.filename,
        kind: "pdf",
        note:
          report.missingPhotos > 0
            ? `${report.missingPhotos} photo${report.missingPhotos === 1 ? "" : "s"} couldn’t be included.`
            : undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate the report");
    } finally {
      setProgress(null);
    }
  }

  function exportCsv() {
    const csv = buildIssuesCsv(snags.data ?? [], levels.data ?? [], options);
    const date = new Date().toISOString().slice(0, 10);
    const slug = slugify(project.data?.name ?? "") || "project";
    onReady({ blob: new Blob([csv], { type: "text/csv;charset=utf-8" }), filename: `issues-${slug}-${date}.csv`, kind: "csv" });
  }

  const busy = !!progress;
  const isModern = options.design === "modern";

  return (
    <form onSubmit={generate} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Generate report</DialogTitle>
        <DialogDescription>Choose a design and what to include.</DialogDescription>
      </DialogHeader>

      {/* Design */}
      <fieldset className="grid gap-2" disabled={busy}>
        <legend className="mb-2 text-sm font-medium">Design</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DESIGNS.map((d) => (
            <label
              key={d.value}
              className={cn(
                "relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-2.5 transition-colors sm:items-stretch",
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
                <span className="text-muted-foreground hidden text-xs sm:block">{d.description}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-muted-foreground text-xs sm:hidden" aria-live="polite">
          {DESIGNS.find((d) => d.value === options.design)?.description}
        </p>
      </fieldset>

      {/* Which snags */}
      <fieldset className="grid gap-2" disabled={busy}>
        <legend className="mb-2 text-sm font-medium">Which issues</legend>
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
            {GROUP_BY_OPTIONS.filter((g) => g.value !== "level" || hasLevels).map((g) => (
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

      {isModern && (
        <div className="grid gap-2">
          <Label htmlFor="report-title">Report title</Label>
          <Input
            id="report-title"
            list="report-title-suggestions"
            value={options.reportTitle}
            onChange={(e) => set("reportTitle", e.target.value)}
            maxLength={60}
            disabled={busy}
          />
          <datalist id="report-title-suggestions">
            {REPORT_TITLE_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      )}

      {isModern &&
        (settings.signatureUrl ? (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
            <input
              type="checkbox"
              checked={options.includeSignature}
              onChange={(e) => set("includeSignature", e.target.checked)}
              disabled={busy}
              className="accent-primary size-4"
            />
            <span className="flex-1">
              <span className="font-medium">Sign the report</span>
              <span className="text-muted-foreground block text-xs">Your signature on the cover page.</span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.signatureUrl} alt="" className="h-8 max-w-24 rounded bg-white object-contain p-0.5" />
          </label>
        ) : (
          <p className="text-muted-foreground -mt-2 text-xs">
            Tip: add your signature and logo in{" "}
            <Link href="/settings" className="text-foreground underline underline-offset-2">
              Settings
            </Link>{" "}
            to have them on the cover.
          </p>
        ))}

      {hasPlans && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
          <input
            type="checkbox"
            checked={options.includeSnippets}
            onChange={(e) => set("includeSnippets", e.target.checked)}
            disabled={busy}
            className="accent-primary mt-0.5 size-4"
          />
          <span>
            <span className="font-medium">Show where each issue is</span>
            <span className="text-muted-foreground block text-xs">
              A small cut-out of the drawing around each pinned issue, next to its details.
            </span>
          </span>
        </label>
      )}

      {hasPlans && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
          <input
            type="checkbox"
            checked={options.includePlans}
            onChange={(e) => set("includePlans", e.target.checked)}
            disabled={busy}
            className="accent-primary mt-0.5 size-4"
          />
          <span>
            <span className="font-medium">Include marked-up plans</span>
            <span className="text-muted-foreground block text-xs">
              A page per level showing its drawing with the pinned issues numbered on it.
            </span>
          </span>
        </label>
      )}

      <DialogFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-center text-sm sm:text-left" aria-live="polite">
          {snags.isPending
            ? "Counting issues…"
            : includedCount === 0
              ? "No issues match these options."
              : `${includedCount} ${includedCount === 1 ? "issue" : "issues"} will be included.`}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={exportCsv}
            disabled={busy || snags.isPending || includedCount === 0}
            title="Spreadsheet of the same issues (Excel, Numbers, Google Sheets)"
          >
            <FileSpreadsheet /> CSV
          </Button>
          <Button type="submit" size="lg" className="flex-1 sm:flex-none" disabled={busy || snags.isPending || includedCount === 0}>
            {busy ? <Loader2 className="animate-spin" /> : <FileDown />}
            <span aria-live="polite">{progress ? progressLabel(progress) : "Generate PDF"}</span>
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** Share (email, WhatsApp, Files…) or save the finished file. */
function ReportReady({ ready, onBack, onDone }: { ready: Ready; onBack: () => void; onDone: () => void }) {
  const ext = ready.kind === "pdf" ? ".pdf" : ".csv";
  const [name, setName] = useState(ready.filename.replace(/\.(pdf|csv)$/i, ""));
  const filename = `${slugify(name) || "report"}${ext}`;
  const file = useMemo(
    () => new File([ready.blob], filename, { type: ready.kind === "pdf" ? "application/pdf" : "text/csv" }),
    [ready, filename],
  );
  const canShare = typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
  const size = ready.blob.size > 1_048_576 ? `${(ready.blob.size / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(ready.blob.size / 1024))} KB`;

  async function share() {
    try {
      await navigator.share({ files: [file], title: name });
      onDone();
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error("Couldn’t open sharing. Try Download instead.");
    }
  }

  function save() {
    downloadBlob(file, filename);
    toast.success(ready.kind === "pdf" ? "Report downloaded" : "Spreadsheet downloaded");
    onDone();
  }

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{ready.kind === "pdf" ? "Report ready" : "Spreadsheet ready"}</DialogTitle>
        <DialogDescription>
          {ready.kind === "pdf" ? "PDF" : "CSV"} · {size}
          {ready.note ? ` · ${ready.note}` : ""}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="report-filename">File name</Label>
        <div className="flex items-center gap-2">
          <Input id="report-filename" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <span className="text-muted-foreground text-sm">{ext}</span>
        </div>
      </div>
      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back to options
        </Button>
        <div className="flex gap-2">
          {canShare && (
            <Button type="button" size="lg" className="flex-1" onClick={share}>
              <Share2 /> Share
            </Button>
          )}
          <Button type="button" size="lg" variant={canShare ? "outline" : "default"} className="flex-1" onClick={save}>
            <Download /> Download
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}

/** A tiny schematic of each design, so the choice is visual rather than just a name. */
function DesignThumbnail({ design }: { design: ReportDesign }) {
  const bar = "bg-foreground/15 rounded-[1px]";
  return (
    <div
      aria-hidden
      className="bg-background flex h-20 w-full max-w-28 shrink-0 flex-col gap-[3px] rounded border p-1.5 shadow-xs sm:max-w-none"
    >
      <div className="bg-foreground/70 h-[3px] w-1/2 rounded-[1px]" />
      <div className="mb-[2px] flex gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(bar, "h-[5px] flex-1")} />
        ))}
      </div>
      {design === "modern" && (
        <div className="flex flex-1 flex-col gap-[3px]">
          <div className="bg-foreground/70 h-[3px] w-3/4 rounded-[1px]" />
          <div className="h-[2px] w-full rounded-[1px] bg-red-600/80" />
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-1 gap-[3px] border-t border-red-600/60 pt-[2px]">
              <div className="bg-foreground/25 w-2/5 rounded-[1px]" />
              <div className="flex flex-1 flex-col gap-[2px]">
                <div className={cn(bar, "h-[2px]")} />
                <div className={cn(bar, "h-[2px] w-2/3")} />
              </div>
            </div>
          ))}
        </div>
      )}
      {design === "table" &&
        [0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-[3px]">
            <div className="bg-foreground/25 h-[7px] w-[9px] rounded-[1px]" />
            <div className={cn(bar, "h-[2px] flex-1")} />
            <div className="bg-foreground/40 h-[3px] w-[6px] rounded-full" />
          </div>
        ))}
      {design === "photos" &&
        [0, 1].map((i) => (
          <div key={i} className="flex flex-1 gap-[3px]">
            <div className="bg-foreground/25 w-1/2 rounded-[1px]" />
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

