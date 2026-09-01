import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import {
  ClientStatusAction,
  ClientStatusBadge,
  clientIdSchema,
  formatDocumentNumber,
  getClientById,
} from "@/modules/clients";
import {
  ContractStatusBadge,
  listContracts,
  type ContractWithClient,
} from "@/modules/contracts";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default async function ClientDetailsPage({
  params,
}: PageProps<"/app/clients/[clientId]">) {
  const route = clientIdSchema.safeParse((await params).clientId);
  if (!route.success) notFound();

  let client;
  try {
    client = await getClientById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();

    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Cliente</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  let contracts: ContractWithClient[];
  let contractsError: string | null = null;
  try {
    contracts = await listContracts({ clientId: client.id });
  } catch (error) {
    contracts = [];
    contractsError = toPublicErrorMessage(error);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/clients">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para clientes
        </Link>
      </Button>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{client.trade_name}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{client.legal_name}</p>
        </div>
        <PermissionGate permission="client:update">
          <Button asChild variant="outline">
            <Link href={`/app/clients/${client.id}/edit`}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <section className="mt-8 rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Dados cadastrais</h2>
        </div>
        <dl className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Razão social
            </dt>
            <dd className="mt-2 text-sm">{client.legal_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nome fantasia
            </dt>
            <dd className="mt-2 text-sm">{client.trade_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              CNPJ
            </dt>
            <dd className="mt-2 text-sm tabular-nums">
              {formatDocumentNumber(client.document_number)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cadastrado em
            </dt>
            <dd className="mt-2 text-sm">{formatDate(client.created_at)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Contratos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vínculos comerciais associados a este cliente.
            </p>
          </div>
          {client.status === "active" ? (
            <PermissionGate permission="contract:create">
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/contracts/new?clientId=${client.id}`}>
                  <Plus className="size-4" aria-hidden="true" />
                  Novo contrato
                </Link>
              </Button>
            </PermissionGate>
          ) : null}
        </div>
        {contractsError ? (
          <p className="p-6 text-sm text-destructive" role="alert">
            {contractsError}
          </p>
        ) : contracts.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Nenhum contrato cadastrado para este cliente.
          </p>
        ) : (
          <ul className="divide-y">
            {contracts.map((contract) => (
              <li key={contract.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <Link className="text-sm font-medium hover:underline" href={`/app/contracts/${contract.id}`}>
                    {contract.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Início: {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${contract.start_date}T00:00:00Z`))}
                  </p>
                </div>
                <ContractStatusBadge status={contract.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-lg border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Status do cliente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clientes inativos permanecem disponíveis para consulta histórica.
          </p>
        </div>
        <PermissionGate permission="client:update">
          <ClientStatusAction clientId={client.id} currentStatus={client.status} />
        </PermissionGate>
      </section>
    </main>
  );
}
