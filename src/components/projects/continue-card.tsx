"use client";

import Link from "next/link";
import { ArrowRight, Laptop, Layers, ListChecks, Smartphone, Tablet } from "lucide-react";
import { useLevels } from "@/hooks/use-levels";
import { useUserState } from "@/hooks/use-resume";
import { formatWhen } from "@/lib/format";
import type { ProjectSummary } from "@/types/models";

const DEVICE = {
  phone: { icon: Smartphone, label: "on your phone" },
  tablet: { icon: Tablet, label: "on your tablet" },
  desktop: { icon: Laptop, label: "on your computer" },
} as const;

/**
 * "Pick up where you left off": the project and view last open on any of
 * the user's devices, one tap away.
 */
export function ContinueCard({ projects }: { projects: ProjectSummary[] }) {
  const state = useUserState();
  const project = projects.find((p) => p.id === state.data?.project_id);
  const levels = useLevels(project?.id);
  if (!state.data || !project) return null;

  const level = levels.data?.find((l) => l.id === state.data!.level_id);
  const onPlans = state.data.view === "plans";
  const href = `/projects/${project.id}${onPlans ? `?view=plans${level ? `&level=${level.id}` : ""}` : ""}`;
  const device = state.data.device ? DEVICE[state.data.device] : null;
  const DeviceIcon = device?.icon;
  const ViewIcon = onPlans ? Layers : ListChecks;
  const outstanding = project.open_snags + project.in_progress_snags;

  return (
    <Link
      href={href}
      className="bg-header text-header-foreground group focus-visible:ring-ring/50 flex items-center gap-4 rounded-2xl p-4 shadow-md outline-none focus-visible:ring-[3px] lg:p-5"
      data-testid="continue-card"
    >
      <div className="min-w-0 flex-1">
        <p className="text-brand text-xs font-semibold tracking-wide uppercase">Continue where you left off</p>
        <p className="mt-1 truncate text-lg font-semibold">{project.name}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
          <span className="inline-flex items-center gap-1">
            <ViewIcon className="size-3.5" />
            {onPlans ? `Plans${level ? ` · ${level.name}` : ""}` : "Snag list"}
          </span>
          {device && DeviceIcon && (
            <span className="inline-flex items-center gap-1">
              <DeviceIcon className="size-3.5" />
              {formatWhen(state.data.updated_at)} {device.label}
            </span>
          )}
          {outstanding > 0 && <span>{outstanding} outstanding</span>}
        </p>
      </div>
      <span className="bg-brand text-brand-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5">
        <ArrowRight className="size-5" />
      </span>
    </Link>
  );
}
