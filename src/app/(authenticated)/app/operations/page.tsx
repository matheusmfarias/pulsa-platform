import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import { listOperations, OperationStatusBadge } from "@/modules/operations";
import { toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string | null): string {
  if (!value) return "Sem data final";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function OperationsPage() {
  let operations;
  try {
    operations = await listOperations();
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Operações</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Execução</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Operações</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Engajamentos operacionais administrados pela Pulsa.
          </p>
        </div>
        <PermissionGate permission="operation:create">
          <Button asChild>
            <Link href="/app/operations/new">
              <Plus className="size-4" aria-hidden="true" />
              Nova operação
            </Link>
          </Button>
        </PermissionGate>
      </div>

      {operations.length === 0 ? (
        <section className="mt-6 rounded-lg border border-dashed bg-card px-6 py-10 text-center">
          <h2 className="font-medium">Nenhuma operação encontrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre a primeira operação para começar.
          </p>
        </section>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Contrato</th>
                  <th className="px-5 py-3 font-medium">Início</th>
                  <th className="px-5 py-3 font-medium">Fim</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {operations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-hover">
                    <td className="px-5 py-4 font-medium">
                      <Link className="hover:underline" href={`/app/operations/${operation.id}`}>
                        {operation.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <Link className="hover:underline" href={`/app/clients/${operation.contract.client.id}`}>
                        {operation.contract.client.trade_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <Link className="hover:underline" href={`/app/contracts/${operation.contract.id}`}>
                        {operation.contract.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">{formatDate(operation.start_date)}</td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">{formatDate(operation.end_date)}</td>
                    <td className="px-5 py-4"><OperationStatusBadge status={operation.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
