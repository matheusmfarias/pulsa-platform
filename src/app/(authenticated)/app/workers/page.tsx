import {
  parseWorkerListSearchParams,
  parseWorkerListPage,
  type WorkerListSearchParams,
} from "@/modules/workers/components/worker-list-filters";
import { WorkersWorkspace } from "@/modules/workers/components/workers-workspace";

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<WorkerListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseWorkerListSearchParams(params);
  const page = parseWorkerListPage(params);
  return <WorkersWorkspace filters={filters} page={page} />;
}
