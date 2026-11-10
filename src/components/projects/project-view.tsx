"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  ClipboardList,
  FolderX,
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
import { useProject } from "@/hooks/use-projects";
import { useDeleteSnag, useSnags, useUpdateSnag } from "@/hooks/use-snags";
import { ServiceError } from "@/lib/services/errors";
import { cn } from "@/lib/utils";
import { SNAG_STATUS_LABEL, type ListedSnag, type SnagStatus } from "@/types/models";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { GenerateReportButton } from "./generate-report-button";
import { ProjectFormDialog } from "./project-form-dialog";

type Filter = "all" | SnagStatus;
const FILTERS: Filter[] = ["all", "open", "in_progress", "resolved"];

export function ProjectView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const project = useProject(projectId);
  const snags = useSnags(projectId);
  const updateSnag = useUpdateSnag(projectId);
  const deleteSnag = useDeleteSnag(projectId);

  const [filter, setFilter] = useState<Filter>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [snagToDelete, setSnagToDelete] = useState<ListedSnag | null>(null);
  const [openSnagId, setOpenSnagId] = useState<string | null>(null);

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

  const visibleSnags = useMemo(
    () => (filter === "all" ? snags.data : snags.data?.filter((s) => s.status === filter)) ?? [],
    [snags.data, filter],
  );

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
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-10" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    );
  }

  if (project.error) {
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
    <div className="grid gap-4">
      <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Projects
      </Link>

      {/* Project header */}
      <section className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight break-words">{p.name}</h1>
              <ProjectStatusBadge status={p.status} />
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

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          {/* Disabled while snags are still saving, so the report can't miss them. */}
          <GenerateReportButton projectId={projectId} disabled={snags.data?.some((s) => s._pending)} />
          <Button size="lg" asChild>
            <Link href={`/projects/${projectId}/add`}>
              <Camera /> Add snags
            </Link>
          </Button>
        </div>
      </section>

      {/* Status filter tabs */}
      <div role="tablist" aria-label="Filter snags by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
              filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent",
            )}
          >
            {f === "all" ? "All" : SNAG_STATUS_LABEL[f]}
            <span className={cn("tabular-nums", filter === f ? "opacity-80" : "text-muted-foreground")}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Snag list */}
      {snags.isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : snags.error ? (
        <ErrorState message={snags.error.message} onRetry={() => snags.refetch()} />
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
        <ul className="grid gap-3">
          {visibleSnags.map((snag) => (
            <li key={snag.id}>
              <SnagCard
                snag={snag}
                onOpen={() => setOpenSnagId(snag.id)}
                onStatusChange={(status) => changeStatus(snag, status)}
                onDelete={() => setSnagToDelete(snag)}
              />
            </li>
          ))}
        </ul>
      )}

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
