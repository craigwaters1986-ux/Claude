"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDuplicateProject } from "@/hooks/use-projects";
import type { DuplicateProgress } from "@/lib/services/duplicate-project";

type Source = { id: string; name: string };

/** Make a copy of a project with its levels and drawings, ready for a new walk-round. */
export function DuplicateProjectDialog({ project, onOpenChange }: { project: Source | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {project && <DuplicateForm key={project.id} project={project} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function DuplicateForm({ project, onDone }: { project: Source; onDone: () => void }) {
  const router = useRouter();
  const duplicate = useDuplicateProject();
  const [name, setName] = useState(`${project.name} (copy)`.slice(0, 120));
  const [progress, setProgress] = useState<DuplicateProgress | null>(null);
  const busy = duplicate.isPending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    duplicate.mutate(
      { sourceId: project.id, name: name.trim(), onProgress: setProgress },
      {
        onSuccess: (created) => {
          toast.success(`“${created.name}” created`);
          onDone();
          router.push(`/projects/${created.id}`);
        },
        onError: (err) => toast.error(err.message || "Couldn’t duplicate the project."),
      },
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Duplicate project</DialogTitle>
        <DialogDescription>
          Copies the location, description, levels and drawings. Issues aren’t copied, so it starts fresh.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="duplicate-name">Name of the new project</Label>
        <Input id="duplicate-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoFocus disabled={busy} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : <Copy />}
          {busy && progress && progress.total > 0 ? `Copying drawings ${progress.done}/${progress.total}…` : busy ? "Duplicating…" : "Duplicate"}
        </Button>
      </DialogFooter>
    </form>
  );
}
