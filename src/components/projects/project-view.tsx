"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  ClipboardList,
  FolderX,
  Layers,
  LayoutGrid,
  Rows3,
  Search,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { ProjectStatusBadge } from "@/components/status-badge";
import { SnagCard } from "@/components/snags/snag-card";
import { SnagDetailDialog } from "@/components/snags/snag-detail-dialog";
import { SnagTable } from "@/components/snags/snag-table";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useProject } from "@/hooks/use-projects";
import { PlansView } from "@/components/plans/plans-view";
import { useLevels } from "@/hooks/use-levels";
import { useLiveUpdates } from "@/hooks/use-live-updates";
import { usePendingSnags } from "@/hooks/use-outbox";
import { useRememberPlace } from "@/hooks/use-resume";
import { useDeleteSnag, useSnags, useUpdateSnag } from "@/hooks/use-snags";
import { ServiceError } from "@/lib/services/errors";
import { cn } from "@/lib/utils";
import { SNAG_STATUS_LABEL, type ListedSnag, type ProjectMode, type SnagStatus } from "@/types/models";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { GenerateReportButton } from "./generate-report-button";
import { ProjectFormDialog } from "./project-form-dialog";

type Filter = "all" | SnagStatus;
const FILTERS: Filter[] = ["all", "open", "in_progress", "resolved"];

export function ProjectView({
  projectId,
  initialMode = "list",
  initialLevelId = null,
}: {
  projectId: string;
  initialMode?: ProjectMode;
  initialLevelId?: string | null;
}) {
  const router = useRouter();
  const project = useProject(projectId);
  const serverSnags = useSnags(projectId);
  // Snags saved on this device but not uploaded yet are shown too, so nothing
  // looks missing while there's no signal.
  const pending = usePendingSnags(projectId);
  const allSnags = useMemo(() => {
    const onServer = new Set((serverSnags.data ?? []).map((s) => s.id));
    return [...(serverSnags.data ?? []), ...pending.filter((p) => !onServer.has(p.id))];
  }, [serverSnags.data, pending]);
  const snags = { ...serverSnags, data: serverSnags.data || pending.length ? allSnags : undefined };
  const updateSnag = useUpdateSnag(projectId);
  const deleteSnag = useDeleteSnag(projectId);

  const [filter, setFilter] = useState<Filter>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [snagToDelete, setSnagToDelete] = useState<ListedSnag | null>(null);
  const [openSnagId, setOpenSnagId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useSnagView();
  const [mode, setModeState] = useState<ProjectMode>(initialMode);
  const [levelId, setLevelIdState] = useState<string | null>(initialLevelId);
  // Keep the address in step (so a refresh or a shared link reopens the same view)
  // without adding a history entry per tap.
  function syncUrl(nextMode: ProjectMode, nextLevel: string | null) {
    const params = new URLSearchParams();
    if (nextMode === "plans") params.set("view", "plans");
    if (nextMode === "plans" && nextLevel) params.set("level", nextLevel);
    const qs = params.toString();
    window.history.replaceState(null, "", `/projects/${projectId}${qs ? `?${qs}` : ""}`);
  }
  function setMode(next: ProjectMode) {
    setModeState(next);
    syncUrl(next, levelId);
  }
  function setLevelId(next: string | null) {
    setLevelIdState(next);
    syncUrl(mode, next);
  }
  useRememberPlace(projectId, mode, levelId);
  const live = useLiveUpdates(projectId);
  const levels = useLevels(projectId);
  const levelNames = useMemo(() => new Map((levels.data ?? []).map((l) => [l.id, l.name])), [levels.data]);
  // Keep this project's drawings on the device, so Plans works with no signal.
  const drawingUrls = (levels.data ?? []).map((l) => l.drawing_url).filter((u): u is string => !!u).join("\n");
  useEffect(() => {
    if (!drawingUrls || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.active?.postMessage({ type: "save-images", urls: drawingUrls.split("\n") }))
      .catch(() => undefined);
  }, [drawingUrls]);
  // Tablets and laptops can choose a table; phones always get cards.
  const wide = useMediaQuery("(min-width: 768px)");
  const showTable = wide && view === "table";

  // Counts come from the live list so they update instantly with optimistic changes.
  const counts = useMemo(() => {
    const list = snags.data ?? [];
    return {
      all: list.length,
      open: list.filter((s) => s.status === "open").length,
      in_progress: list.filter((s) => s.status === "in_progress").length,
      resolved: list.filter((s) => s.status === "resolved").length,
    } satisfies Record<Filter, number>;
  }, [snags.data]);

  const visibleSnags = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (snags.data ?? []).filter(
      (s) =>
        (filter === "all" || s.status === filter) &&
        (!q || [s.title, s.assigned_to, s.description, String(s.snag_number)].some((f) => f?.toLowerCase().includes(q))),
    );
  }, [snags.data, filter, query]);

  function changeStatus(snag: ListedSnag, status: SnagStatus) {
    updateSnag.mutate(
      { snagId: snag.id, patch: { status } },
      { onError: (err) => toast.error(err.message) },
    );
  }

  function confirmDeleteSnag() {
    if (!snagToDelete) return;
    const { id, snag_number } = snagToDelete;
    deleteSnag.mutate(id, {
      onSuccess: () => toast.success(`Snag #${snag_number} deleted`),
      onError: (err) => toast.error(err.message),
    });
    setSnagToDelete(null);
  }

  if (project.isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-10" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    );
  }

  if (project.error && !project.data) {
    const notFound = project.error instanceof ServiceError && project.error.code === "PGRST116";
    return notFound ? (
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description="It may have been deleted, or you don’t have access to it."
        action={
          <Button asChild variant="outline">
            <Link href="/">Back to projects</Link>
          </Button>
        }
      />
    ) : (
      <ErrorState message={project.error.message} onRetry={() => project.refetch()} />
    );
  }

  const p = project.data;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <aside className="grid gap-4 lg:sticky lg:top-24">
      <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Projects
      </Link>

      {/* Project header */}
      <section className="surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl leading-tight font-bold break-words">{p.name}</h1>
              <ProjectStatusBadge status={p.status} />
              {live && <LiveDot />}
            </div>
            {p.location && (
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                <MapPin className="size-3.5 shrink-0" /> {p.location}
              </p>
            )}
            {p.description && <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">{p.description}</p>}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="-mt-1 -mr-2 shrink-0" aria-label="Project actions">
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil /> Edit project
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 /> Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end lg:grid lg:grid-cols-1">
          {/* Disabled while snags are still saving, so the report can't miss them. */}
          <GenerateReportButton projectId={projectId} disabled={pending.length > 0} />
          <Button size="lg" asChild>
            <Link href={`/projects/${projectId}/add`}>
              <Camera /> Add snags
            </Link>
          </Button>
        </div>
        {/* Laptop: status at a glance in the side panel */}
        {counts.all > 0 && (
          <dl className="mt-5 hidden grid-cols-3 gap-2 border-t pt-4 text-center lg:grid">
            {(["open", "in_progress", "resolved"] as const).map((st) => (
              <div key={st}>
                <dt className="text-muted-foreground text-xs">{SNAG_STATUS_LABEL[st]}</dt>
                <dd className="text-2xl font-bold tabular-nums">{counts[st]}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      </aside>

      <div className="grid min-w-0 grid-cols-1 gap-4">
      {/* Toolbar: status filter, search, and (laptop) cards/table switch */}
      <div className="grid min-w-0 gap-3 lg:flex lg:flex-wrap lg:items-center lg:justify-between">
      {/* Snags as a list, or pinned on the drawings */}
      <div className="bg-muted flex w-full rounded-lg p-0.5 lg:w-auto" role="group" aria-label="View">
        {(
          [
            ["list", ClipboardList, "Snags"],
            ["plans", Layers, "Plans"],
          ] as const
        ).map(([value, Icon, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium transition-colors lg:h-8 lg:flex-none",
              mode === value ? "bg-card shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      <div role="tablist" aria-label="Filter snags by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
              filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent",
            )}
          >
            {f === "all" ? "All" : SNAG_STATUS_LABEL[f]}
            <span className={cn("tabular-nums", filter === f ? "opacity-80" : "text-muted-foreground")}>{counts[f]}</span>
          </button>
        ))}
      </div>
      {counts.all > 0 && (
        <div className="flex items-center gap-2 lg:ml-auto">
          <div className="relative flex-1 lg:w-60 lg:flex-none">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search snags"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-9 md:h-9"
              aria-label="Search snags"
            />
          </div>
          <div className={cn("bg-muted hidden rounded-lg p-0.5", mode === "list" && "md:flex")} role="group" aria-label="Layout">
            {(
              [
                ["cards", LayoutGrid, "Cards"],
                ["table", Rows3, "Table"],
              ] as const
            ).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                aria-pressed={view === value}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors",
                  view === value ? "bg-card shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Snag list */}
      {mode === "plans" ? (
        <PlansView
          projectId={projectId}
          allSnags={snags.data ?? []}
          visibleSnags={visibleSnags}
          onOpenSnag={setOpenSnagId}
          selectedLevelId={levelId}
          onSelectLevel={setLevelId}
        />
      ) : snags.isPending && !snags.data ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : snags.error && !snags.data ? (
        <ErrorState message={snags.error.message} onRetry={() => snags.refetch()} />
      ) : visibleSnags.length === 0 && query.trim() ? (
        <EmptyState icon={Search} title="No matching snags" description="Try a different search." />
      ) : visibleSnags.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={filter === "all" ? "No snags logged yet" : `No ${SNAG_STATUS_LABEL[filter].toLowerCase()} snags`}
          description={filter === "all" ? "Walk the site and log each defect with a photo." : undefined}
          action={
            filter === "all" ? (
              <Button asChild size="lg">
                <Link href={`/projects/${projectId}/add`}>
                  <Camera /> Start logging
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Only one of the two is built, so the page holds each snag once. */}
          {showTable ? (
            <SnagTable
              snags={visibleSnags}
              levelNames={levelNames}
              onOpen={(snag) => setOpenSnagId(snag.id)}
              onStatusChange={changeStatus}
              onDelete={setSnagToDelete}
            />
          ) : (
            <ul className="grid gap-3 xl:grid-cols-2">
              {visibleSnags.map((snag) => (
                <li key={snag.id}>
                  <SnagCard
                    snag={snag}
                    levelName={snag.level_id ? levelNames.get(snag.level_id) : undefined}
                    onOpen={() => setOpenSnagId(snag.id)}
                    onStatusChange={(status) => changeStatus(snag, status)}
                    onDelete={() => setSnagToDelete(snag)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      </div>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={p} />
      <DeleteProjectDialog
        project={deleteOpen ? p : null}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.replace("/")}
      />
      <SnagDetailDialog projectId={projectId} snagId={openSnagId} onOpenChange={(open) => !open && setOpenSnagId(null)} />
      <AlertDialog open={!!snagToDelete} onOpenChange={(open) => !open && setSnagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete snag #{snagToDelete?.snag_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{snagToDelete?.title}” and its {snagToDelete?.photos.length === 1 ? "photo" : "photos"} will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSnag} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const VIEW_KEY = "snaglist.snag-view";

/** Cards or table on tablets/laptops (phones always use cards). Remembered per device. */
function useSnagView() {
  const [view, setViewState] = useState<"cards" | "table">(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === "cards" ? "cards" : "table";
    } catch {
      return "table";
    }
  });
  function setView(next: "cards" | "table") {
    setViewState(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // storage blocked: just don't remember
    }
  }
  return [view, setView] as const;
}

/** Shown while changes from other devices arrive live. */
function LiveDot() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
      title="Changes made on your other devices appear here automatically"
      data-testid="live-indicator"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}
