import { Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listPositionsForGlobalView,
  positionGlobalListFiltersSchema,
  PositionStatusBadge,
} from "@/modules/positions";
import { resolveOperationalContext } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";

const OCCUPYING_ASSIGNMENT_STATUS = "active";

export default async function PositionsPage({
  searchParams,
}: PageProps<"/app/positions">) {
  const query = await searchParams;
  const filters = positionGlobalListFiltersSchema.parse({
    query: query.q,
    status: query.status === "all" ? undefined : query.status,
  });

  let positions;
  try {
    const { context } = await resolveOperationalContext();
    positions = await listPositionsForGlobalView(filters, context);
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Postos</h1>
        <p className="mt-6 text-sm text-destructive">{toPublicErrorMessage(error)}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-primary">Operação</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Postos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Postos operacionais definidos nas unidades.
        </p>
      </div>

      <form className="mt-6 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          <Input className="pl-9" name="q" defaultValue={filters.query} placeholder="Buscar por cargo" aria-label="Buscar postos por cargo" />
        </div>
        <select name="status" defaultValue={filters.status ?? "all"} aria-label="Filtrar postos por status" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>

      {positions.length === 0 ? (
        <section className="mt-6 rounded-lg border border-dashed bg-card px-6 py-10 text-center">
          <h2 className="font-medium">Nenhum posto cadastrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Os postos representam necessidades operacionais dentro das unidades.
          </p>
        </section>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Cargo</th>
                  <th className="px-5 py-3 font-medium">Unidade</th>
                  <th className="px-5 py-3 font-medium">Operação</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Efetivo</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {positions.map((position) => {
                  const occupied = position.assignments.filter(
                    (assignment) => assignment.status === OCCUPYING_ASSIGNMENT_STATUS,
                  ).length;
                  const href = `/app/units/${position.unit.id}/positions/${position.id}`;
                  return (
                    <tr key={position.id} className="hover:bg-hover">
                      <td className="px-5 py-4 font-medium"><Link className="hover:underline" href={href}>{position.job_role.name}</Link></td>
                      <td className="px-5 py-4 text-muted-foreground">{position.unit.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{position.unit.operation.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{position.unit.operation.contract.client.trade_name}</td>
                      <td className="px-5 py-4 tabular-nums"><span className="font-medium text-foreground">{occupied}</span> de {position.base_required_headcount}</td>
                      <td className="px-5 py-4"><PositionStatusBadge status={position.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
