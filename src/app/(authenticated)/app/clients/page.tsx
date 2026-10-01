import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import { ClientFilterBar, hasActiveClientFilters } from "@/modules/clients/components/client-filter-bar";
import { ClientTable } from "@/modules/clients/components/client-table";
import { clientListFiltersSchema, type ClientListFilters } from "@/modules/clients/schemas/client-schemas";
import { listClients } from "@/modules/clients/services/list-clients";
import { toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

type SearchParams = Promise<{
  q?: string;
  status?: string;
}>;

function ClientResultsSkeleton() {
  return (
    <section aria-label="Carregando dados dos clientes" className="mt-5 overflow-hidden rounded-card bg-surface shadow-card sm:mt-6" role="status">
      <span className="sr-only">Carregando dados dos clientes…</span>
      <div className="border-b border-border-default px-5 py-4">
        <div aria-hidden="true" className="h-4 w-36 animate-pulse rounded-control bg-subtle" />
      </div>
      <div className="divide-y divide-border-default/80">
        {Array.from({ length: 5 }, (_, index) => (
          <div aria-hidden="true" className="flex min-h-16 items-center gap-5 px-5 py-3" key={index}>
            <div className="h-4 flex-1 animate-pulse rounded-control bg-subtle" />
            <div className="h-4 w-28 animate-pulse rounded-control bg-subtle" />
          </div>
        ))}
      </div>
    </section>
  );
}

async function ClientResults({ filters }: { filters: ClientListFilters }) {
  let clients;

  try {
    clients = await listClients(filters);
  } catch (error) {
    return (
      <FeedbackMessage className="mt-6" variant="danger">
        {toPublicErrorMessage(error)}
      </FeedbackMessage>
    );
  }

  const hasActiveFilters = hasActiveClientFilters(filters);

  return (
    <div className="mt-5 sm:mt-6">
      {clients.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{clients.length}</span>{" "}
          {clients.length === 1 ? "cliente encontrado" : "clientes encontrados"}
          {hasActiveFilters ? " com os filtros atuais" : ""}
        </p>
      ) : hasActiveFilters ? (
        <p className="text-sm text-muted-foreground">Nenhum cliente encontrado com os filtros atuais</p>
      ) : null}

      {clients.length === 0 ? (
        <section className="mt-4 rounded-card bg-surface shadow-card px-6 py-8 text-center sm:py-10">
          <h2 className="font-medium">
            {hasActiveFilters ? "Nenhum cliente corresponde aos filtros" : "Nenhum cliente cadastrado"}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {hasActiveFilters
              ? "Ajuste a busca, altere o status ou limpe os filtros para visualizar outros clientes."
              : "Os clientes representam as empresas atendidas comercialmente pela Pulsa."}
          </p>
        </section>
      ) : (
        <ClientTable clients={clients} />
      )}
    </div>
  );
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const parameters = await searchParams;

  const filters = clientListFiltersSchema.parse({
    query: parameters.q,
    status: parameters.status,
  });

  return (
    <PageShell data-no-entry-animation>
      <ContentContainer size="list">
        <PageHeader
          actions={
            <PermissionGate permission="client:create">
              <Button asChild>
                <Link href="/app/clients/new">
                  <Plus aria-hidden="true" className="size-4" />
                  Novo cliente
                </Link>
              </Button>
            </PermissionGate>
          }
          breadcrumb={
            <Breadcrumb
              items={[
                {
                  label: "Comercial",
                },
                {
                  label: "Clientes",
                },
              ]}
            />
          }
          description="Empresas atendidas pela Pulsa, incluindo registros ativos e inativos."
          title="Clientes"
        />

        <ClientFilterBar filters={filters} />

        <Suspense fallback={<ClientResultsSkeleton />} key={`${filters.query}:${filters.status}`}>
          <ClientResults filters={filters} />
        </Suspense>
      </ContentContainer>
    </PageShell>
  );
}
