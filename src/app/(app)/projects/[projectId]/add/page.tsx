import { RapidEntry } from "@/components/snags/rapid-entry";

export const metadata = { title: "Add snags · SnagList" };

export default async function AddSnagsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <RapidEntry projectId={projectId} />;
}
