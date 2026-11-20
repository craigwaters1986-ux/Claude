"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteProject } from "@/hooks/use-projects";
import { plural } from "@/lib/format";
import type { ProjectSummary } from "@/types/models";

type Props = {
  project: ProjectSummary | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteProjectDialog({ project, onOpenChange, onDeleted }: Props) {
  const deleteProject = useDeleteProject();

  async function confirm() {
    if (!project) return;
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success(`Deleted “${project.name}”`);
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete project");
    }
  }

  return (
    <AlertDialog open={!!project} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            “{project?.name}” and its {plural(project?.total_snags ?? 0, "issue")}, including photos,
            will be permanently deleted. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProject.isPending}>Cancel</AlertDialogCancel>
          {/* A plain Button (not AlertDialogAction) so the dialog stays open while deleting. */}
          <Button variant="destructive" onClick={confirm} disabled={deleteProject.isPending}>
            {deleteProject.isPending && <Loader2 className="animate-spin" />}
            Delete project
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
