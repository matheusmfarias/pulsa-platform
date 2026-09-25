import {
  NewWorkerDrawer,
  parseWorkerListSearchParams,
  parseWorkerListPage,
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
  const returnHref = workerListHref("/app/workers", filters, page);

  return (
    <>
      <WorkersWorkspace filters={filters} page={page} />
      <NewWorkerDrawer returnHref={returnHref} />
    </>
  );
}
