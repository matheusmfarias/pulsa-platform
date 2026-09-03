import { Plus } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import {
  ClientFilterBar,
  ClientTable,
  clientListFiltersSchema,
  hasActiveClientFilters,
  listClients,
} from "@/modules/clients";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{
  q?: string;
  status?: string;
}>;

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

  let clients;

  try {
    clients = await listClients(filters);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            description="Empresas atendidas pela Pulsa, incluindo registros ativos e inativos."
            eyebrow="Comercial"
            title="Clientes"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const hasActiveFilters = hasActiveClientFilters(filters);

  return (
    <PageShell>
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
          description="Empresas atendidas pela Pulsa, incluindo registros ativos e inativos."
          eyebrow="Comercial"
          title="Clientes"
        />

        <ClientFilterBar filters={filters} />

        <div className="mt-5 sm:mt-6">
          {clients.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {clients.length}
              </span>{" "}
              {clients.length === 1
                ? "cliente encontrado"
                : "clientes encontrados"}
              {hasActiveFilters ? " com os filtros atuais" : ""}
            </p>
          ) : hasActiveFilters ? (
            <p className="text-sm text-muted-foreground">
              Nenhum cliente encontrado com os filtros atuais
            </p>
          ) : null}

          {clients.length === 0 ? (
            <section className="mt-4 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
              <h2 className="font-medium">
                {hasActiveFilters
                  ? "Nenhum cliente corresponde aos filtros"
                  : "Nenhum cliente cadastrado"}
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
      </ContentContainer>
    </PageShell>
  );
}