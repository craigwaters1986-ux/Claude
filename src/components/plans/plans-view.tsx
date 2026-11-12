"use client";

import { useMemo, useState } from "react";
import { Layers, MapPinOff, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { useLevels } from "@/hooks/use-levels";
import { cn } from "@/lib/utils";
import type { ListedSnag } from "@/types/models";
import { LevelFormDialog } from "./level-form-dialog";
import { PlanViewer, type PlanPin } from "./plan-viewer";

type Props = {
  projectId: string;
  /** Every snag in the project (for per-level counts). */
  allSnags: ListedSnag[];
  /** Snags after the status filter and search: these are the pins shown. */
  visibleSnags: ListedSnag[];
  onOpenSnag: (snagId: string) => void;
  /** Which level is showing (null = the first). Controlled, so it can be remembered and linked to. */
  selectedLevelId: string | null;
  onSelectLevel: (levelId: string | null) => void;
};

/** The project's drawings, level by level, with snags pinned on them. */
export function PlansView({ projectId, allSnags, visibleSnags, onOpenSnag, selectedLevelId, onSelectLevel }: Props) {
  const levels = useLevels(projectId);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  const selected = levels.data?.find((l) => l.id === selectedLevelId) ?? levels.data?.[0];
  const setSelectedId = onSelectLevel;

  const pins: PlanPin[] = useMemo(
    () =>
      visibleSnags
        .filter((s) => selected && s.level_id === selected.id && s.pin_x != null && s.pin_y != null && !s._pending)
        .map((s) => ({ id: s.id, x: s.pin_x!, y: s.pin_y!, label: String(s.snag_number), status: s.status, title: s.title })),
    [visibleSnags, selected],
  );
  const onLevel = selected ? allSnags.filter((s) => s.level_id === selected.id) : [];
  const unpinned = selected ? visibleSnags.filter((s) => s.level_id === selected.id && s.pin_x == null) : [];

  if (levels.isPending) return <Skeleton className="h-96 rounded-2xl" />;
  if (levels.error && !levels.data) return <ErrorState message={levels.error.message} onRetry={() => levels.refetch()} />;

  return (
    <div className="grid min-w-0 gap-3">
      {levels.data.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No levels yet"
          description="Add a level for each floor or area and upload its drawing. Then pin snags to the spot they’re at."
          action={
            <Button size="lg" onClick={() => setAdding(true)}>
              <Plus /> Add level
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div role="tablist" aria-label="Levels" className="-mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
              {levels.data.map((level) => {
                const count = allSnags.filter((s) => s.level_id === level.id).length;
                const active = level.id === selected?.id;
                return (
                  <button
                    key={level.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedId(level.id)}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent",
                    )}
                  >
                    {level.name}
                    <span className={cn("tabular-nums", active ? "opacity-80" : "text-muted-foreground")}>{count}</span>
                  </button>
                );
              })}
            </div>
            <Button variant="outline" size="icon" onClick={() => setEditing(true)} aria-label={`Edit level ${selected?.name}`}>
              <Pencil />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setAdding(true)} aria-label="Add level">
              <Plus />
            </Button>
          </div>

          {selected?.drawing_url ? (
            <>
              <PlanViewer
                key={selected.id + selected.drawing_url}
                level={selected}
                pins={pins}
                onPinClick={(pin) => onOpenSnag(pin.id)}
                className="h-[60dvh] min-h-80 lg:h-[calc(100dvh-17rem)]"
              />
              <p className="text-muted-foreground text-sm" aria-live="polite">
                {pins.length} pinned on this drawing
                {unpinned.length > 0 && ` · ${unpinned.length} on this level without a pin`}
                {pins.length === 0 && onLevel.length === 0 && ". Pin snags from “Add snags”, or open a snag and set its location."}
              </p>
            </>
          ) : (
            selected && (
              <EmptyState
                icon={MapPinOff}
                title={`No drawing for ${selected.name}`}
                description="Upload a PDF or image of the plan to pin snags on it."
                action={
                  <Button size="lg" onClick={() => setEditing(true)}>
                    <Plus /> Add drawing
                  </Button>
                }
              />
            )
          )}
        </>
      )}

      <LevelFormDialog projectId={projectId} open={adding} onOpenChange={setAdding} onCreated={(level) => setSelectedId(level.id)} />
      <LevelFormDialog
        projectId={projectId}
        open={editing && !!selected}
        onOpenChange={setEditing}
        level={selected}
        snagCount={onLevel.length}
        onDeleted={() => setSelectedId(null)}
      />
    </div>
  );
}
