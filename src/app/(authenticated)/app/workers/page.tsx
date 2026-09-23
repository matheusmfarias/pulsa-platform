import {
  parseWorkerListSearchParams,
  WorkersWorkspace,
  type WorkerListSearchParams,
} from "@/modules/workers";

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<WorkerListSearchParams>;
}) {
  const filters = parseWorkerListSearchParams(await searchParams);
  return <WorkersWorkspace filters={filters} />;
}
