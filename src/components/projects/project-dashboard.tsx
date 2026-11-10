"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, HardHat, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { useProjects } from "@/hooks/use-projects";
import type { ProjectSummary } from "@/types/models";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectCard } from "./project-card";
import { ProjectFormDialog } from "./project-form-dialog";

export function ProjectDashboard() {
  const router = useRouter();
  const { data: projects, isPending, error, refetch } = useProjects();

  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectSummary | undefined>();
  const [deleting, setDeleting] = useState<ProjectSummary | null>(null);

  const archivedCount = projects?.filter((p) => p.status === "archived").length ?? 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects ?? []).filter((p) => {
      if (!showArchived && p.status === "archived") return false;
      if (!q) return true;
      return [p.name, p.location, p.description].some((f) => f?.toLowerCase().includes(q));
    });
  }, [projects, query, showArchived]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(project: ProjectSummary) {
    setEditing(project);
    setFormOpen(true);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Button onClick={openCreate} className="hidden sm:inline-flex">
          <Plus /> New project
        </Button>
      </div>

      {projects && projects.length > 0 && (
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search projects"
          />
        </div>
      )}

      {isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="No projects yet"
          description="Create a project for each site or job, then start logging snags."
          action={
            <Button onClick={openCreate} size="lg">
              <FolderPlus /> Create your first project
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={Search} title="No matching projects" description="Try a different search." />
      ) : (
        <ul className="grid gap-3">
          {visible.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} onEdit={openEdit} onDelete={setDeleting} />
            </li>
          ))}
        </ul>
      )}

      {archivedCount > 0 && (
        <Button variant="link" className="justify-self-center" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? "Hide" : "Show"} archived ({archivedCount})
        </Button>
      )}

      {/* Floating action button: thumb-reachable on phones. */}
      <Button
        onClick={openCreate}
        size="icon-lg"
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg sm:hidden"
        aria-label="New project"
      >
        <Plus className="size-6" />
      </Button>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editing}
        onCreated={(project) => router.push(`/projects/${project.id}`)}
      />
      <DeleteProjectDialog project={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  );
}
