import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/modules/authorization";
import {
  ClientStatusBadge,
  clientListFiltersSchema,
  formatDocumentNumber,
  listClients,
} from "@/modules/clients";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const parameters = await searchParams;
  const filters = clientListFiltersSchema.parse({
    query: parameters.q,
    status: parameters.status,
  });

  let result;
  try {
    result = await listClients(filters);
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="mt-6 rounded-lg border bg-card p-6">
          <p className="text-sm text-destructive" role="alert">
            {toPublicErrorMessage(error)}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Cadastros</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Empresas atendidas pela Pulsa, incluindo registros ativos e inativos.
          </p>
        </div>
        <PermissionGate permission="client:create">
          <Button asChild>
            <Link href="/app/clients/new">
              <Plus className="size-4" aria-hidden="true" />
              Novo cliente
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <form className="mt-8 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            name="q"
            defaultValue={filters.query}
            placeholder="Buscar por nome"
            aria-label="Buscar clientes por nome"
          />
        </div>
        <select
          name="status"
          defaultValue={filters.status}
          aria-label="Filtrar clientes por status"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>

      {result.length === 0 ? (
        <section className="mt-6 rounded-lg border border-dashed bg-card px-6 py-14 text-center">
          <h2 className="font-medium">Nenhum cliente encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {filters.query || filters.status !== "all"
              ? "Ajuste os filtros para consultar outros registros."
              : "Cadastre o primeiro cliente para começar."}
          </p>
        </section>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome fantasia</th>
                  <th className="px-5 py-3 font-medium">Razão social</th>
                  <th className="px-5 py-3 font-medium">Documento</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/35">
                    <td className="px-5 py-4 font-medium">
                      <Link className="hover:underline" href={`/app/clients/${client.id}`}>
                        {client.trade_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{client.legal_name}</td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">
                      {formatDocumentNumber(client.document_number)}
                    </td>
                    <td className="px-5 py-4"><ClientStatusBadge status={client.status} /></td>
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
