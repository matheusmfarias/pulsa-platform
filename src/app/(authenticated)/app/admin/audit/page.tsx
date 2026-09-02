import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_LABELS,
  AUDIT_ENTITY_TYPES,
  auditListFiltersSchema,
  listAuditEvents,
  listOrganizationMembers,
  readAuditMetadata,
  type AuditListFilters,
} from "@/modules/administration";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{
  page?: string | string[];
  from?: string | string[];
  to?: string | string[];
  entityType?: string | string[];
  action?: string | string[];
  actorId?: string | string[];
}>;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function paginationHref(filters: AuditListFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.action) params.set("action", filters.action);
  if (filters.actorId) params.set("actorId", filters.actorId);
  params.set("page", String(page));
  return `/app/admin/audit?${params.toString()}`;
}

export default async function AdministrationAuditPage({ searchParams }: { searchParams: SearchParams }) {
  const parameters = await searchParams;
  const filters = auditListFiltersSchema.parse(parameters);

  let result;
  let members;
  try {
    [result, members] = await Promise.all([
      listAuditEvents(filters),
      listOrganizationMembers(),
    ]);
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Auditoria</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-primary">Administração</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Auditoria</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registro operacional de mudanças da organização, do evento mais recente ao mais antigo.
        </p>
      </div>

      <form className="mt-6 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_1.2fr_1.4fr_auto]">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          De
          <input type="date" name="from" defaultValue={filters.from} className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Até
          <input type="date" name="to" defaultValue={filters.to} className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Entidade
          <select name="entityType" defaultValue={filters.entityType ?? ""} className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="">Todas</option>
            {AUDIT_ENTITY_TYPES.map((type) => <option key={type} value={type}>{AUDIT_ENTITY_LABELS[type]}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Ação
          <select name="action" defaultValue={filters.action ?? ""} className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="">Todas</option>
            {AUDIT_ACTIONS.map((action) => <option key={action} value={action}>{AUDIT_ACTION_LABELS[action]}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Ator
          <select name="actorId" defaultValue={filters.actorId ?? ""} className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="">Todos</option>
            {members.map((member) => <option key={member.profile_id} value={member.profile_id}>{member.profile?.display_name ?? member.profile_id}</option>)}
          </select>
        </label>
        <Button type="submit" variant="outline" className="self-end">
          <Search className="size-4" aria-hidden="true" />
          Filtrar
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>{result.total} {result.total === 1 ? "evento" : "eventos"}</p>
        <p>Página {result.page} de {result.pageCount}</p>
      </div>

      {result.items.length === 0 ? (
        <section className="mt-4 rounded-lg border border-dashed bg-card px-6 py-14 text-center">
          <h2 className="font-medium">Nenhum evento encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ajuste os filtros ou consulte outro período.</p>
        </section>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Data/hora</th>
                  <th className="px-4 py-3 font-medium">Ator</th>
                  <th className="px-4 py-3 font-medium">Entidade</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                  <th className="px-4 py-3 font-medium">Resumo</th>
                  <th className="px-4 py-3 text-right font-medium">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.items.map((event) => {
                  const metadata = readAuditMetadata(event.metadata);
                  return (
                    <tr key={event.id} className="align-top hover:bg-hover">
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDateTime(event.created_at)}</td>
                      <td className="max-w-48 px-4 py-3">
                        <p className="truncate font-medium">{event.actor?.display_name ?? "Ator sem nome"}</p>
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{event.actor_user_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{AUDIT_ENTITY_LABELS[event.entity_type]}</p>
                        <p className="mt-1 max-w-40 truncate font-mono text-xs text-muted-foreground">{event.entity_id}</p>
                      </td>
                      <td className="px-4 py-3">{AUDIT_ACTION_LABELS[event.action]}</td>
                      <td className="max-w-80 px-4 py-3 text-muted-foreground">
                        {metadata.changes.length > 0 ? metadata.changes.map((field) => ({ description: "Descrição", name: "Nome", status: "Status", role: "Papel" })[field] ?? field).join(", ") : "Sem campos resumidos"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/app/admin/audit/${event.id}`}>Ver</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <nav aria-label="Paginação da auditoria" className="mt-6 flex items-center justify-between">
        {result.page > 1 ? (
          <Button asChild variant="outline"><Link href={paginationHref(filters, result.page - 1)}><ArrowLeft className="size-4" aria-hidden="true" />Anterior</Link></Button>
        ) : <span />}
        {result.page < result.pageCount ? (
          <Button asChild variant="outline"><Link href={paginationHref(filters, result.page + 1)}>Próxima<ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
        ) : null}
      </nav>
    </main>
  );
}
