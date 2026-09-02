import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/modules/authorization";
import { resolveOperationalContext } from "@/modules/operational-context";
import {
  formatCpf,
  listWorkersWithCurrentAssignment,
  workerListFiltersSchema,
  WorkerStatusBadge,
} from "@/modules/workers";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{ q?: string; status?: string }>;

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
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Colaboradores</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pessoas</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Colaboradores</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastro e situação dos colaboradores da organização.
          </p>
        </div>
        <PermissionGate permission="worker:create">
          <Button asChild>
            <Link href="/app/workers/new">
              <Plus className="size-4" aria-hidden="true" />
              Novo colaborador
            </Link>
          </Button>
        </PermissionGate>
      </div>
      <form className="mt-6 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            name="q"
            defaultValue={filters.query}
            placeholder="Buscar por nome ou CPF"
            aria-label="Buscar colaboradores por nome ou CPF"
          />
        </div>
        <select
          name="status"
          defaultValue={filters.status}
          aria-label="Filtrar colaboradores por status"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="onboarding">Em onboarding</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="terminated">Encerrados</option>
        </select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>
      {workers.length === 0 ? (
        <section className="mt-6 rounded-lg border border-dashed bg-card px-6 py-10 text-center">
          <h2 className="font-medium">Nenhum colaborador encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou cadastre o primeiro colaborador.
          </p>
        </section>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">CPF</th>
                  <th className="px-5 py-3 font-medium">Contato</th>
                  <th className="px-5 py-3 font-medium">Alocação atual</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-hover">
                    <td className="px-5 py-4 font-medium">
                      <Link
                        className="hover:underline"
                        href={`/app/workers/${worker.id}`}
                      >
                        {worker.full_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">
                      {formatCpf(worker.document_number)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {worker.email ?? worker.phone ?? "Não informado"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {worker.currentAssignment ? (
                        <>
                          {worker.currentAssignment.position.job_role.name} · {" "}
                          <Link
                            className="hover:underline"
                            href={`/app/units/${worker.currentAssignment.position.unit.id}`}
                          >
                            {worker.currentAssignment.position.unit.name}
                          </Link>
                        </>
                      ) : (
                        "Sem alocação"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <WorkerStatusBadge status={worker.status} />
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
