import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import {
  ContractStatusAction,
  ContractStatusBadge,
  contractIdSchema,
  getContractById,
} from "@/modules/contracts";
import {
  listOperations,
  OperationStatusBadge,
  type OperationWithContext,
} from "@/modules/operations";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string | null): string {
  if (!value) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function ContractDetailsPage({
  params,
}: PageProps<"/app/contracts/[contractId]">) {
  const route = contractIdSchema.safeParse((await params).contractId);
  if (!route.success) notFound();

  let contract;
  try {
    contract = await getContractById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Contrato</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  let operations: OperationWithContext[];
  let operationsError: string | null = null;
  try {
    operations = await listOperations({ contractId: contract.id });
  } catch (error) {
    operations = [];
    operationsError = toPublicErrorMessage(error);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/contracts">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para contratos
        </Link>
      </Button>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{contract.name}</h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Cliente:{" "}
            <Link className="font-medium text-foreground hover:underline" href={`/app/clients/${contract.client.id}`}>
              {contract.client.trade_name}
            </Link>
          </p>
        </div>
        <PermissionGate permission="contract:update">
          <Button asChild variant="outline">
            <Link href={`/app/contracts/${contract.id}/edit`}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <section className="mt-8 rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Dados do contrato</h2>
        </div>
        <dl className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cliente</dt>
            <dd className="mt-2 text-sm">{contract.client.trade_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Referência externa</dt>
            <dd className="mt-2 text-sm">{contract.external_reference ?? "Não informada"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data inicial</dt>
            <dd className="mt-2 text-sm tabular-nums">{formatDate(contract.start_date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data final</dt>
            <dd className="mt-2 text-sm tabular-nums">{formatDate(contract.end_date)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Operações</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Engajamentos operacionais vinculados a este contrato.
            </p>
          </div>
          {contract.status === "active" ? (
            <PermissionGate permission="operation:create">
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/operations/new?contractId=${contract.id}`}>
                  <Plus className="size-4" aria-hidden="true" />
                  Nova operação
                </Link>
              </Button>
            </PermissionGate>
          ) : null}
        </div>
        {operationsError ? (
          <p className="p-6 text-sm text-destructive" role="alert">
            {operationsError}
          </p>
        ) : operations.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Nenhuma operação cadastrada para este contrato.
          </p>
        ) : (
          <ul className="divide-y">
            {operations.map((operation) => (
              <li key={operation.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <Link className="text-sm font-medium hover:underline" href={`/app/operations/${operation.id}`}>
                    {operation.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Início: {formatDate(operation.start_date)}
                  </p>
                </div>
                <OperationStatusBadge status={operation.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Status do contrato</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          As alterações são explícitas e estados finais preservam o histórico.
        </p>
        <div className="mt-4">
          <PermissionGate permission="contract:update">
            <ContractStatusAction contractId={contract.id} currentStatus={contract.status} />
          </PermissionGate>
        </div>
      </section>
    </main>
  );
}
