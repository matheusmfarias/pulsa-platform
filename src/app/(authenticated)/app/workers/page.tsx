import { Plus } from "lucide-react";
import Link from "next/link";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import { resolveOperationalContext } from "@/modules/operational-context";
import {
  hasActiveWorkerFilters,
  listWorkersWithCurrentAssignment,
  workerListFiltersSchema,
  WorkerFilterBar,
  WorkerTable,
} from "@/modules/workers";
import { toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

type SearchParams = Promise<{ q?: string; status?: string }>;

function NewWorkerButton() {
  return (
    <PermissionGate permission="worker:create">
      <Button asChild>
        <Link href="/app/workers/new">
          <Plus aria-hidden="true" className="size-4" />
          Novo colaborador
        </Link>
      </Button>
    </PermissionGate>
  );
}

function WorkersEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <section
      aria-labelledby="workers-empty-title"
      className="mt-4 border-y border-dashed border-border-strong px-4 py-10 text-center"
    >
      <h2 className="font-medium" id="workers-empty-title">
        {filtered
          ? "Nenhum colaborador corresponde aos filtros"
          : "Nenhum colaborador cadastrado"}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {filtered
          ? "Limpe ou ajuste a busca e o status para ampliar os resultados."
          : "Cadastre o primeiro colaborador para iniciar sua gestão operacional."}
      </p>
      <div className="mt-5 flex justify-center">
        {filtered ? (
          <Button asChild variant="outline">
            <Link href="/app/workers">Limpar filtros</Link>
          </Button>
        ) : (
          <NewWorkerButton />
        )}
      </div>
    </section>
  );
}

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const parameters = await searchParams;
  const filters = workerListFiltersSchema.parse({
    query: parameters.q,
    status: parameters.status,
  });

  let workers;
  try {
    const { context } = await resolveOperationalContext();
    workers = await listWorkersWithCurrentAssignment(filters, context);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            breadcrumb={<Breadcrumb items={[{ label: "Pessoas" }, { label: "Colaboradores" }]} />}
            title="Colaboradores"
            description="Cadastro, situação e contexto operacional dos colaboradores."
          />
          <FeedbackMessage className="mt-6" variant="danger">
            <p className="font-medium">Não foi possível carregar os colaboradores.</p>
            <p className="mt-1">{toPublicErrorMessage(error)}</p>
          </FeedbackMessage>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/app/workers">Tentar novamente</Link>
          </Button>
        </ContentContainer>
      </PageShell>
    );
  }

  const filtered = hasActiveWorkerFilters(filters);

  return (
    <PageShell>
      <ContentContainer size="list">
        <PageHeader
          actions={<NewWorkerButton />}
          description="Cadastro, situação e contexto operacional dos colaboradores."
          breadcrumb={<Breadcrumb items={[{ label: "Pessoas" }, { label: "Colaboradores" }]} />}
          title="Colaboradores"
        />

        <WorkerFilterBar filters={filters} />

        <div
          aria-live="polite"
          className="mt-5 flex min-h-6 items-center justify-between gap-4 text-sm"
        >
          <p>
            <span className="font-semibold tabular-nums">{workers.length}</span>{" "}
            <span className="text-muted-foreground">
              {workers.length === 1 ? "colaborador encontrado" : "colaboradores encontrados"}
              {filtered ? " com os filtros aplicados" : ""}
            </span>
          </p>
        </div>

        {workers.length === 0 ? (
          <WorkersEmptyState filtered={filtered} />
        ) : (
          <WorkerTable workers={workers} />
        )}
      </ContentContainer>
    </PageShell>
  );
}
