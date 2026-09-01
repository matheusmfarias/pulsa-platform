import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/modules/authorization";
import {
  JobRoleStatusBadge,
  jobRoleListFiltersSchema,
  listJobRoles,
} from "@/modules/job-roles";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function JobRolesPage({ searchParams }: { searchParams: SearchParams }) {
  const parameters = await searchParams;
  const filters = jobRoleListFiltersSchema.parse({
    query: parameters.q,
    status: parameters.status,
  });
  let jobRoles;
  try {
    jobRoles = await listJobRoles(filters);
  } catch (error) {
    return <main className="mx-auto max-w-7xl px-4 py-10"><h1 className="text-2xl font-semibold">Cargos</h1><p className="mt-6 text-sm text-destructive">{toPublicErrorMessage(error)}</p></main>;
  }
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-primary">Cadastros</p><h1 className="mt-1 text-2xl font-semibold">Cargos</h1><p className="mt-2 text-sm text-muted-foreground">Catálogo organizacional reutilizável de cargos e funções.</p></div>
        <PermissionGate permission="job_role:create"><Button asChild><Link href="/app/job-roles/new"><Plus className="size-4" />Novo cargo</Link></Button></PermissionGate>
      </div>
      <form className="mt-8 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" name="q" defaultValue={filters.query} placeholder="Buscar por nome" aria-label="Buscar cargos por nome" /></div>
        <select name="status" defaultValue={filters.status} className="h-10 rounded-md border border-input bg-background px-3 text-sm" aria-label="Filtrar cargos por status"><option value="all">Todos os status</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>
      {jobRoles.length === 0 ? <section className="mt-6 rounded-lg border border-dashed bg-card px-6 py-14 text-center"><h2 className="font-medium">Nenhum cargo encontrado</h2></section> : <div className="mt-6 overflow-hidden rounded-lg border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Nome</th><th className="px-5 py-3">Descrição</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y">{jobRoles.map((jobRole) => <tr key={jobRole.id}><td className="px-5 py-4 font-medium"><Link className="hover:underline" href={`/app/job-roles/${jobRole.id}`}>{jobRole.name}</Link></td><td className="px-5 py-4 text-muted-foreground">{jobRole.description ?? "Não informada"}</td><td className="px-5 py-4"><JobRoleStatusBadge status={jobRole.status} /></td></tr>)}</tbody></table></div>}
    </main>
  );
}
