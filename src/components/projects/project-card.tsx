"use client";

import Link from "next/link";
import { MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { ProjectSummary } from "@/types/models";

type Props = {
  project: ProjectSummary;
  onEdit: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
};

export function ProjectCard({ project, onEdit, onDelete }: Props) {
  const outstanding = project.open_snags + project.in_progress_snags;
  const progress = project.total_snags ? project.resolved_snags / project.total_snags : 0;

  return (
    <div className="surface relative h-full transition-[box-shadow,border-color] has-[a:hover]:border-foreground/15 has-[a:hover]:shadow-md">
      {/* The whole card is the link; the menu button sits above it. */}
      <Link
        href={`/projects/${project.id}`}
        className="focus-visible:ring-ring/50 flex h-full flex-col justify-between rounded-2xl p-4 pr-14 outline-none focus-visible:ring-[3px]"
      >
        <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-[17px] font-semibold">{project.name}</h2>
          {project.status !== "active" && <ProjectStatusBadge status={project.status} />}
        </div>
        {project.location && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1 truncate text-sm">
            <MapPin className="size-3.5 shrink-0" />
            {project.location}
          </p>
        )}
        </div>

        <div>
        <div className="mt-4 flex items-end justify-between gap-4 text-sm">
          <div className="flex gap-4">
            <Stat value={outstanding} label="Outstanding" tone={outstanding ? "text-red-700 dark:text-red-400" : undefined} />
            <Stat value={project.resolved_snags} label="Resolved" />
            <Stat value={project.total_snags} label="Total" />
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">{formatDate(project.created_at)}</span>
        </div>

        {project.total_snags > 0 && (
          <div
            className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full"
            role="progressbar"
            aria-label="Snags resolved"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="bg-foreground h-full rounded-full" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-lg" className="absolute top-2 right-2" aria-label={`Actions for ${project.name}`}>
            <MoreVertical className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(project)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(project)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: string }) {
  return (
    <div>
      <div className={`text-xl leading-none font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
      <div className="text-muted-foreground mt-1 text-xs">{label}</div>
    </div>
  );
}
