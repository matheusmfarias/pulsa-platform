import {
  NewWorkerDrawer,
  parseWorkerListSearchParams,
  parseWorkerListPage,
  parseWorkerListPageSize,
  workerListHref,
  type WorkerListSearchParams,
} from "@/modules/workers";

export default async function InterceptedNewWorkerPage({
  searchParams,
}: {
  searchParams: Promise<WorkerListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseWorkerListSearchParams(params);
  const page = parseWorkerListPage(params);
  const pageSize = parseWorkerListPageSize(params);
  const returnHref = workerListHref("/app/workers", filters, page, pageSize);

  return <NewWorkerDrawer closeMode="back" returnHref={returnHref} />;
}
