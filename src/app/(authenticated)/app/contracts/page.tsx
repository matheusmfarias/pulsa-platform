import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import { ContractStatusBadge, listContracts } from "@/modules/contracts";
import { toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string | null): string {
  if (!value) return "Sem data final";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function ContractsPage() {
  let contracts;
  try {
    contracts = await listContracts();
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Contratos</h1>
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
          <p className="text-sm font-medium text-primary">Comercial</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vínculos comerciais dos clientes atendidos pela Pulsa.
          </p>
        </div>
        <PermissionGate permission="contract:create">
          <Button asChild>
            <Link href="/app/contracts/new">
              <Plus className="size-4" aria-hidden="true" />
              Novo contrato
            </Link>
          </Button>
        </PermissionGate>
      </div>

      {contracts.length === 0 ? (
        <section className="mt-8 rounded-lg border border-dashed bg-card px-6 py-14 text-center">
          <h2 className="font-medium">Nenhum contrato encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre o primeiro contrato para começar.
          </p>
        </section>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Início</th>
                  <th className="px-5 py-3 font-medium">Fim</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-muted/35">
                    <td className="px-5 py-4 font-medium">
                      <Link className="hover:underline" href={`/app/contracts/${contract.id}`}>
                        {contract.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <Link className="hover:underline" href={`/app/clients/${contract.client.id}`}>
                        {contract.client.trade_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">
                      {formatDate(contract.start_date)}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">
                      {formatDate(contract.end_date)}
                    </td>
                    <td className="px-5 py-4">
                      <ContractStatusBadge status={contract.status} />
                    </td>
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
