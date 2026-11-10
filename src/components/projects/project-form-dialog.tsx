"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import {
  PROJECT_STATUS_LABEL,
  PROJECT_STATUSES,
  type Project,
  type ProjectInput,
  type ProjectStatus,
} from "@/types/models";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a project to edit it; omit to create a new one. */
  project?: Project;
  onCreated?: (project: Project) => void;
};

/** Create / edit project dialog. Remounts its fields each time it opens. */
export function ProjectFormDialog({ open, onOpenChange, project, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <ProjectForm
            project={project}
            onDone={(created) => {
              onOpenChange(false);
              if (created) onCreated?.(created);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({
  project,
  onDone,
}: {
  project?: Project;
  onDone: (created?: Project) => void;
}) {
  const isEdit = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const pending = createProject.isPending || updateProject.isPending;

  const [values, setValues] = useState<Required<ProjectInput>>({
    name: project?.name ?? "",
    location: project?.location ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "active",
  });

  const set =
    <K extends keyof ProjectInput>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: ProjectInput = {
      name: values.name,
      location: values.location?.trim() || null,
      description: values.description?.trim() || null,
      status: values.status,
    };
    try {
      if (isEdit) {
        await updateProject.mutateAsync({ projectId: project.id, patch: input });
        toast.success("Project updated");
        onDone();
      } else {
        const created = await createProject.mutateAsync(input);
        toast.success("Project created");
        onDone(created);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Update the project details." : "Add a site or job to start logging snags."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          value={values.name}
          onChange={set("name")}
          placeholder="e.g. Plot 14, Meadow View"
          maxLength={200}
          required
          autoFocus={!isEdit}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="project-location">Location</Label>
        <Input
          id="project-location"
          value={values.location ?? ""}
          onChange={set("location")}
          placeholder="Address or site reference"
          autoComplete="street-address"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea
          id="project-description"
          value={values.description ?? ""}
          onChange={set("description")}
          placeholder="Client, contract, scope… (optional)"
          rows={3}
        />
      </div>

      {isEdit && (
        <div className="grid gap-2">
          <Label htmlFor="project-status">Status</Label>
          <NativeSelect id="project-status" value={values.status} onChange={set("status")}>
            {PROJECT_STATUSES.map((s: ProjectStatus) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABEL[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" size="lg" onClick={() => onDone()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={pending || !values.name.trim()}>
          {pending && <Loader2 className="animate-spin" />}
          {isEdit ? "Save changes" : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}
