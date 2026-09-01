import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  assignmentListFiltersSchema,
  AssignmentStatusBadge,
  listAssignments,
} from "@/modules/assignments";
import { PermissionGate } from "@/modules/authorization";
import { toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string | null) {
  if (!value) return "Sem término";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function AssignmentsPage({ searchParams }: PageProps<"/app/assignments">) {
  const query = await searchParams;
  const filters = assignmentListFiltersSchema.parse({ status: query.status });
  let assignments;
  try {
    assignments = await listAssignments(filters);
  } catch (error) {
    return <main className="mx-auto max-w-7xl px-4 py-10"><h1 className="text-2xl font-semibold">Alocações</h1><p className="mt-6 text-sm text-destructive">{toPublicErrorMessage(error)}</p></main>;
  }
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Alocações</p>
          <h1 className="mt-1 text-2xl font-semibold">Alocações</h1>
          <p className="mt-2 text-sm text-muted-foreground">Relações temporais entre colaboradores e postos.</p>
        </div>
        <PermissionGate permission="assignment:create">
          <Button asChild><Link href="/app/assignments/new"><Plus className="size-4" />Nova alocação</Link></Button>
        </PermissionGate>
      </div>
      <form className="mt-8 flex max-w-sm gap-3 rounded-lg border bg-card p-4">
        <select name="status" defaultValue={filters.status ?? "all"} className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="active">Ativas</option>
          <option value="suspended">Suspensas</option>
          <option value="finished">Finalizadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>
      {assignments.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">Nenhuma alocação encontrada.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Colaborador</th><th className="px-5 py-3">Posto</th><th className="px-5 py-3">Unidade</th><th className="px-5 py-3">Período</th><th className="px-5 py-3">Status</th></tr></thead>
            <tbody className="divide-y">
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-5 py-4 font-medium"><Link className="hover:underline" href={`/app/assignments/${assignment.id}`}>{assignment.worker.full_name}</Link></td>
                  <td className="px-5 py-4">{assignment.position.job_role.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{assignment.position.unit.name}</td>
                  <td className="px-5 py-4 tabular-nums">{formatDate(assignment.start_date)} — {formatDate(assignment.end_date)}</td>
                  <td className="px-5 py-4"><AssignmentStatusBadge status={assignment.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
