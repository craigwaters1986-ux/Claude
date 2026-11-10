import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUS_LABEL,
  SNAG_STATUS_LABEL,
  type ProjectStatus,
  type SnagStatus,
} from "@/types/models";

/** Colour per snag status — also used for the filter tabs and select. */
export const SNAG_STATUS_CLASS: Record<SnagStatus, string> = {
  open: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  active: "bg-foreground/[0.06] text-foreground",
  on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  archived: "bg-muted text-muted-foreground",
};

export function SnagStatusBadge({ status, className }: { status: SnagStatus; className?: string }) {
  return (
    <Badge className={cn("border-transparent", SNAG_STATUS_CLASS[status], className)}>
      {SNAG_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <Badge className={cn("border-transparent", PROJECT_STATUS_CLASS[status], className)}>
      {PROJECT_STATUS_LABEL[status]}
    </Badge>
  );
}
