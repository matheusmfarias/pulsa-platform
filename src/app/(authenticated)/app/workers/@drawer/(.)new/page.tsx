import {
  NewWorkerDrawer,
  parseWorkerListSearchParams,
  workerListHref,
  type WorkerListSearchParams,
} from "@/modules/workers";

export default async function InterceptedNewWorkerPage({
  searchParams,
}: {
  searchParams: Promise<WorkerListSearchParams>;
}) {
  const filters = parseWorkerListSearchParams(await searchParams);
  const returnHref = workerListHref("/app/workers", filters);

  return <NewWorkerDrawer closeMode="back" returnHref={returnHref} />;
}
