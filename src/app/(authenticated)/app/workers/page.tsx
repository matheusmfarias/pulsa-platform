import {
  parseWorkerListSearchParams,
  parseWorkerListPage,
  parseWorkerListPageSize,
  WorkersWorkspace,
  type WorkerListSearchParams,
} from "@/modules/workers";

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<WorkerListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseWorkerListSearchParams(params);
  const page = parseWorkerListPage(params);
  const pageSize = parseWorkerListPageSize(params);
  return <WorkersWorkspace filters={filters} page={page} pageSize={pageSize} />;
}
