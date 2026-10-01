import {
  NewWorkerDrawer,
  parseWorkerListSearchParams,
  parseWorkerListPage,
  parseWorkerListPageSize,
  workerListHref,
  WorkersWorkspace,
  type WorkerListSearchParams,
} from "@/modules/workers";

export default async function NewWorkerPage({
  searchParams,
}: {
  searchParams: Promise<WorkerListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseWorkerListSearchParams(params);
  const page = parseWorkerListPage(params);
  const pageSize = parseWorkerListPageSize(params);
  const returnHref = workerListHref("/app/workers", filters, page, pageSize);

  return (
    <>
      <WorkersWorkspace filters={filters} page={page} pageSize={pageSize} />
      <NewWorkerDrawer returnHref={returnHref} />
    </>
  );
}
