import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ListEmptyState, ListResultSummary } from "@/components/layout/list";
import { ListPagination } from "@/components/layout/list-pagination";
import { ListNavigationProvider, ListPendingSurface } from "@/components/layout/list-navigation";
import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import { getOperationalContextSelection } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";

import type { WorkerListFilters } from "../schemas/worker-schemas";
import { listWorkersPageWithCurrentAssignment } from "../services/list-workers-with-current-assignment";
import type { WorkerListPageSize } from "../domain/worker-list-pagination";
import { WorkerFilterBar } from "./worker-filter-bar";
import { WorkerCreateSuccessToast } from "./worker-create-success-toast";
import { hasActiveWorkerFilters, workerListHref } from "./worker-list-filters";
import { WorkerTable } from "./worker-table";

function NewWorkerButton({ href }: { href: string }) {
  return (
    <PermissionGate permission="worker:create">
      <Button asChild className="w-full sm:w-auto">
        <Link href={href} scroll={false}>
          <Plus aria-hidden="true" className="size-4" />
          Novo colaborador
        </Link>
      </Button>
    </PermissionGate>
  );
}

function WorkersEmptyState({
  createHref,
  filtered,
}: {
  createHref: string;
  filtered: boolean;
}) {
  return (
    <ListEmptyState
      aria-labelledby="workers-empty-title"
      action={
        filtered ? (
          <Button asChild variant="outline">
            <Link href="/app/workers">Limpar filtros</Link>
          </Button>
        ) : (
          <NewWorkerButton href={createHref} />
        )
      }
      className="mt-0 border-x-0 border-b-0"
      description={
        filtered
          ? "Limpe ou ajuste a busca e o status para ampliar os resultados."
          : "Cadastre o primeiro colaborador para iniciar sua gestão operacional."
      }
      title={
        filtered
          ? "Nenhum colaborador corresponde aos filtros"
          : "Nenhum colaborador cadastrado"
      }
      titleId="workers-empty-title"
    />
  );
}

function Skeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={"animate-pulse rounded-control bg-subtle " + className}
    />
  );
}

function WorkersResultsLoading() {
  return (
    <div aria-label="Atualizando colaboradores" role="status">
      <div className="flex min-h-12 items-center px-5 py-2.5">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-1.5 h-3 w-24" />
        </div>
      </div>
      <div className="border-t border-border-default">
        <div aria-hidden="true" className="grid min-h-10 grid-cols-[minmax(0,1fr)_5rem_2rem] items-center gap-3 bg-subtle/45 px-3 sm:grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr_auto] sm:gap-6 sm:px-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12 sm:hidden" />
          <Skeleton className="hidden h-3 w-16 sm:block" />
          <Skeleton className="hidden h-3 w-16 sm:block" />
          <Skeleton className="hidden h-3 w-16 sm:block" />
          <Skeleton className="hidden h-3 w-16 sm:block" />
          <Skeleton className="hidden h-3 w-5 justify-self-end sm:block" />
        </div>
        <div className="divide-y divide-border-default/80">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className={`grid min-h-14 grid-cols-[minmax(0,1fr)_5rem_2rem] items-center gap-3 px-3 py-2.5 sm:grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr_auto] sm:gap-6 sm:px-5 ${index === 3 ? "hidden sm:grid" : ""}`}
              key={index}
            >
              <div className="min-w-0">
                <Skeleton className="h-4 w-4/5" />
                <div className="mt-1.5 space-y-1 sm:hidden">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="hidden h-4 w-full sm:block" />
              <Skeleton className="hidden h-4 w-full sm:block" />
              <Skeleton className="hidden h-5 w-16 sm:block" />
              <Skeleton className="h-5 w-5 justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function WorkersResults({
  createHref,
  filters,
  page,
  pageSize,
}: {
  createHref: string;
  filters: WorkerListFilters;
  page: number;
  pageSize: WorkerListPageSize;
}) {
  let result;

  try {
    const context = await getOperationalContextSelection();
    result = await listWorkersPageWithCurrentAssignment(filters, context, page, pageSize);
  } catch (error) {
    return (
      <div className="px-4 py-6">
        <FeedbackMessage variant="danger">
          <p className="font-medium">Não foi possível carregar os colaboradores.</p>
          <p className="mt-1">{toPublicErrorMessage(error)}</p>
        </FeedbackMessage>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/app/workers">Tentar novamente</Link>
        </Button>
      </div>
    );
  }

  const filtered = hasActiveWorkerFilters(filters);
  const workers = result.workers;

  return (
    <>
      <ListResultSummary className="mt-0 min-h-12 px-5 py-2.5">
        <p>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {result.total} {result.total === 1 ? "colaborador" : "colaboradores"}
          </span>
          {filtered ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Resultados filtrados
            </span>
          ) : null}
        </p>
      </ListResultSummary>

      {workers.length === 0 && result.page === 1 ? (
        <WorkersEmptyState createHref={createHref} filtered={filtered} />
      ) : (
        <>
          {workers.length === 0 ? (
            <div className="border-t border-border-default px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Esta página não tem colaboradores. A lista pode ter mudado desde a última visita.
              </p>
              <Button asChild className="mt-4" size="sm" variant="outline">
                  <Link href={workerListHref("/app/workers", filters, 1, pageSize)} scroll={false}>
                  Ir para a primeira página
                </Link>
              </Button>
            </div>
          ) : (
            <ListPendingSurface>
              <WorkerTable workers={workers} />
            </ListPendingSurface>
          )}
          <ListPagination
            currentPage={result.page}
            getHref={(targetPage) => workerListHref("/app/workers", filters, targetPage, pageSize)}
            getPageSizeHref={(targetSize) => workerListHref("/app/workers", filters, 1, targetSize as WorkerListPageSize)}
            label="colaboradores"
            pageCount={result.pageCount}
            pageSize={result.pageSize}
            total={result.total}
          />
        </>
      )}
    </>
  );
}

export function WorkersWorkspace({ filters, page = 1, pageSize }: { filters: WorkerListFilters; page?: number; pageSize: WorkerListPageSize }) {
  const createHref = workerListHref("/app/workers/new", filters, page, pageSize);

  return (
    <ListNavigationProvider>
    <PageShell className="py-7 sm:py-8">
      <ContentContainer size="list">
        <PageHeader
          actions={<NewWorkerButton href={createHref} />}
          breadcrumb={<Breadcrumb items={[{ label: "Pessoas" }, { label: "Colaboradores" }]} />}
          className="gap-4 sm:items-center"
          description="Cadastro, situação e contexto operacional dos colaboradores."
          title="Colaboradores"
        />

        <WorkerFilterBar pageSize={pageSize}>
          <Suspense fallback={<WorkersResultsLoading />}>
            <WorkersResults createHref={createHref} filters={filters} page={page} pageSize={pageSize} />
          </Suspense>
        </WorkerFilterBar>
      </ContentContainer>
      <Suspense fallback={null}>
        <WorkerCreateSuccessToast />
      </Suspense>
    </PageShell>
    </ListNavigationProvider>
  );
}
