import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ListEmptyState, ListResultSummary } from "@/components/layout/list";
import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import { resolveOperationalContext } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";

import type { WorkerListFilters } from "../schemas/worker-schemas";
import { listWorkersPageWithCurrentAssignment } from "../services/list-workers-with-current-assignment";
import { WorkerFilterBar } from "./worker-filter-bar";
import { WorkerCreateSuccessToast } from "./worker-create-success-toast";
import { hasActiveWorkerFilters, workerListHref } from "./worker-list-filters";
import { WorkerTable } from "./worker-table";

function NewWorkerButton({ href }: { href: string }) {
  return (
    <PermissionGate permission="worker:create">
      <Button asChild>
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
        <Skeleton className="h-10 w-full rounded-none" />
        <div className="divide-y divide-border-default/80">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="grid min-h-14 grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr] items-center gap-6 px-4 py-3"
              key={index}
            >
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkersWorkspaceLoading() {
  return (
    <section
      aria-label="Carregando lista de colaboradores"
      className="mt-6 overflow-hidden rounded-surface border border-border-default bg-surface"
    >
      <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:p-4">
        <Skeleton className="h-10 min-w-0 flex-1" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="border-t border-border-default">
        <WorkersResultsLoading />
      </div>
    </section>
  );
}

async function WorkersResults({
  createHref,
  filters,
  page,
}: {
  createHref: string;
  filters: WorkerListFilters;
  page: number;
}) {
  let result;

  try {
    const { context } = await resolveOperationalContext();
    result = await listWorkersPageWithCurrentAssignment(filters, context, page);
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
            {workers.length} {workers.length === 1 ? "colaborador nesta página" : "colaboradores nesta página"}
          </span>
          {filtered ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Resultados filtrados
            </span>
          ) : null}
        </p>
      </ListResultSummary>

      {workers.length === 0 && page === 1 ? (
        <WorkersEmptyState createHref={createHref} filtered={filtered} />
      ) : (
        <>
          {workers.length === 0 ? (
            <div className="border-t border-border-default px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Esta página não tem colaboradores. A lista pode ter mudado desde a última visita.
              </p>
              <Button asChild className="mt-4" size="sm" variant="outline">
                <Link href={workerListHref("/app/workers", filters)} scroll={false}>
                  Ir para a primeira página
                </Link>
              </Button>
            </div>
          ) : <WorkerTable workers={workers} />}
          <div className="flex items-center justify-between gap-3 border-t border-border-default px-4 py-3">
            <span className="text-xs text-muted-foreground">Página {page}</span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={workerListHref("/app/workers", filters, page - 1)} scroll={false}>
                    Anterior
                  </Link>
                </Button>
              ) : <Button disabled size="sm" variant="outline">Anterior</Button>}
              {result.hasNextPage ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={workerListHref("/app/workers", filters, page + 1)} scroll={false}>
                    Próxima
                  </Link>
                </Button>
              ) : <Button disabled size="sm" variant="outline">Próxima</Button>}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function WorkersWorkspace({ filters, page = 1 }: { filters: WorkerListFilters; page?: number }) {
  const createHref = workerListHref("/app/workers/new", filters, page);
  const filtersKey = `${filters.query}:${filters.status}:${page}`;

  return (
    <PageShell className="py-7 sm:py-8">
      <ContentContainer size="list">
        <PageHeader
          actions={<NewWorkerButton href={createHref} />}
          breadcrumb={<Breadcrumb items={[{ label: "Pessoas" }, { label: "Colaboradores" }]} />}
          className="gap-4 sm:items-center"
          description="Cadastro, situação e contexto operacional dos colaboradores."
          title="Colaboradores"
        />

        <Suspense fallback={<WorkersWorkspaceLoading />}>
          <WorkerFilterBar>
            <Suspense fallback={<WorkersResultsLoading />} key={filtersKey}>
              <WorkersResults createHref={createHref} filters={filters} page={page} />
            </Suspense>
          </WorkerFilterBar>
        </Suspense>
      </ContentContainer>
      <Suspense fallback={null}>
        <WorkerCreateSuccessToast />
      </Suspense>
    </PageShell>
  );
}
