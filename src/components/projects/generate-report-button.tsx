"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/hooks/use-supabase";
import { downloadBlob, generateSnagReport, type ReportProgress } from "@/lib/pdf/generate-report";

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

export function GenerateReportButton({ projectId, disabled }: { projectId: string; disabled?: boolean }) {
  const supabase = useSupabase();
  const [progress, setProgress] = useState<ReportProgress | null>(null);

  async function generate() {
    setProgress({ stage: "loading" });
    try {
      const report = await generateSnagReport(supabase, projectId, setProgress);
      downloadBlob(report.blob, report.filename);
      if (report.missingPhotos > 0) {
        toast.warning(
          `Report created, but ${report.missingPhotos} photo${report.missingPhotos === 1 ? "" : "s"} couldn’t be included.`,
        );
      } else {
        toast.success("Report downloaded");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate the report");
    } finally {
      setProgress(null);
    }
  }

  return (
    <Button variant="outline" size="lg" onClick={generate} disabled={disabled || !!progress} aria-busy={!!progress}>
      {progress ? <Loader2 className="animate-spin" /> : <FileDown />}
      <span aria-live="polite">{progress ? progressLabel(progress) : "Generate report"}</span>
    </Button>
  );
}
