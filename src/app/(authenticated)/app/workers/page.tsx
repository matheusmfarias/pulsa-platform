import { Suspense } from "react";

import { DataRouteSkeleton } from "@/components/ui/data-route-skeleton";

import {
  parseWorkerListSearchParams,
  parseWorkerListPage,
  parseWorkerListPageSize,
  WorkersWorkspace,
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
    <Suspense
      fallback={
        <DataRouteSkeleton
          kind="collection"
          label="Carregando colaboradores"
          scope="core"
        />
      }
    >
      <WorkersPageContent searchParams={searchParams} />
    </Suspense>
  );
}
