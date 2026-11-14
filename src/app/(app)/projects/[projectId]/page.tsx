import { ProjectView } from "@/components/projects/project-view";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string; level?: string }>;
}) {
  const { projectId } = await params;
  const { view, level } = await searchParams;
  return (
    <ProjectView
      projectId={projectId}
      initialMode={view === "plans" ? "plans" : "list"}
      initialLevelId={typeof level === "string" ? level : null}
    />
  );
}
