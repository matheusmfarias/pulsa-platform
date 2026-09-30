import { Suspense } from "react";

import {
  parseWorkerListSearchParams,
  parseWorkerListPage,
  parseWorkerListPageSize,
  WorkersWorkspace,
  WorkersListLoading,
  type WorkerListSearchParams,
} from "@/modules/workers";

async function WorkersPageContent({
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

export default function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<WorkerListSearchParams>;
}) {
  return (
    <Suspense fallback={<WorkersListLoading />}>
      <WorkersPageContent searchParams={searchParams} />
    </Suspense>
  );
}
