import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import {
  getOperationById,
  operationIdSchema,
  OperationStatusAction,
  OperationStatusBadge,
} from "@/modules/operations";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { listUnits, UnitStatusBadge } from "@/modules/units";

function formatDate(value: string | null): string {
  if (!value) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function OperationDetailsPage({
  params,
}: PageProps<"/app/operations/[operationId]">) {
  const route = operationIdSchema.safeParse((await params).operationId);
  if (!route.success) notFound();

  let operation;
  let units;
  try {
    [operation, units] = await Promise.all([
      getOperationById(route.data),
      listUnits({ operationId: route.data }),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Operação</h1>
        <p
          className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive"
          role="alert"
        >
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/operations">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para operações
        </Link>
      </Button>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {operation.name}
            </h1>
            <OperationStatusBadge status={operation.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Contrato:{" "}
            <Link
              className="font-medium text-foreground hover:underline"
              href={`/app/contracts/${operation.contract.id}`}
            >
              {operation.contract.name}
            </Link>
          </p>
        </div>
        <PermissionGate permission="operation:update">
          <Button asChild variant="outline">
            <Link href={`/app/operations/${operation.id}/edit`}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <section className="mt-8 rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Dados da operação</h2>
        </div>
        <dl className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cliente
            </dt>
            <dd className="mt-2 text-sm">
              {operation.contract.client.trade_name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contrato
            </dt>
            <dd className="mt-2 text-sm">{operation.contract.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Data inicial
            </dt>
            <dd className="mt-2 text-sm tabular-nums">
              {formatDate(operation.start_date)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Data final
            </dt>
            <dd className="mt-2 text-sm tabular-nums">
              {formatDate(operation.end_date)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Gestor responsável
            </dt>
            <dd className="mt-2 text-sm break-all">
              {operation.manager_user_id ?? "Não definido"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Descrição
            </dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm">
              {operation.description ?? "Não informada"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Status da operação</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          As mudanças seguem transições explícitas e preservam o histórico.
        </p>
        <div className="mt-4">
          <PermissionGate permission="operation:update">
            <OperationStatusAction
              operationId={operation.id}
              currentStatus={operation.status}
            />
          </PermissionGate>
        </div>
      </section>

      <section className="mt-6 rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-semibold">Unidades</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Locais vinculados a esta operação.
            </p>
          </div>
          {operation.status !== "closed" ? (
            <PermissionGate permission="unit:create">
              <Button asChild size="sm">
                <Link href={`/app/units/new?operationId=${operation.id}`}>
                  <Plus className="size-4" aria-hidden="true" />
                  Nova unidade
                </Link>
              </Button>
            </PermissionGate>
          ) : null}
        </div>
        {units.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Nenhuma unidade cadastrada.
          </p>
        ) : (
          <ul className="divide-y">
            {units.map((unit) => (
              <li
                key={unit.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <Link
                    className="font-medium hover:underline"
                    href={`/app/units/${unit.id}`}
                  >
                    {unit.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {unit.code ?? "Sem código"}
                  </p>
                </div>
                <UnitStatusBadge status={unit.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
