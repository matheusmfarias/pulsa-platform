import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { ListPagination } from "@/components/layout/list-pagination";
import { ListNavigationProvider, ListPendingSurface } from "@/components/layout/list-navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { AuditListFilterBar } from "./audit-list-filter-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/table";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  auditListFiltersSchema,
  listAuditEvents,
  listOrganizationMembers,
  readAuditMetadata,
  type AuditListFilters,
} from "@/modules/administration";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{
  page?: string | string[];
  size?: string | string[];
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
function paginationHref(filters: AuditListFilters, page: number, pageSize = filters.pageSize): string {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.action) params.set("action", filters.action);
  if (filters.actorId) params.set("actorId", filters.actorId);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== 10) params.set("size", String(pageSize));
  return `/app/admin/audit?${params.toString()}`;
}

export default async function AdministrationAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = auditListFiltersSchema.parse(await searchParams);
  let result;
  let members;
  try {
    [result, members] = await Promise.all([
      listAuditEvents(filters),
      listOrganizationMembers(),
    ]);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[{ label: "Administração" }, { label: "Auditoria" }]}
              />
            }
            title="Auditoria"
          />
          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }
  const fieldLabels: Record<string, string> = {
    description: "Descrição",
    name: "Nome",
    status: "Status",
    role: "Papel",
  };
  const events = result.items.map((event) => {
    const metadata = readAuditMetadata(event.metadata);
    const summary = metadata.changes.length > 0
      ? metadata.changes.map((field) => fieldLabels[field] ?? field).join(", ")
      : "Sem campos resumidos";
    return { event, summary };
  });
  return (
    <ListNavigationProvider>
    <PageShell>
      <ContentContainer size="list">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[{ label: "Administração" }, { label: "Auditoria" }]}
            />
          }
          description="Registro operacional de mudanças da organização, do evento mais recente ao mais antigo."
          title="Auditoria"
        />
        <AuditListFilterBar
          actorOptions={members.map((member) => ({
            label: member.profile?.display_name ?? member.profile_id,
            value: member.profile_id,
          }))}
          filters={filters}
        >
        <div className="mt-0 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            {result.total} {result.total === 1 ? "evento" : "eventos"}
          </p>
        </div>
        {events.length === 0 ? (
          <section className="mt-4 rounded-card bg-surface shadow-card px-6 py-8 text-center sm:py-10">
            <h2 className="font-medium">Nenhum evento encontrado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajuste os filtros ou consulte outro período.
            </p>
          </section>
        ) : (
          <ListPendingSurface>
          <section className="mt-4 overflow-hidden rounded-card bg-surface shadow-card">
            <ul className="divide-y divide-border-default md:hidden">
              {events.map(({ event, summary }) => (
                <li className="space-y-2 p-4" key={event.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-semibold">
                      {AUDIT_ACTION_LABELS[event.action]} · {AUDIT_ENTITY_LABELS[event.entity_type]}
                    </p>
                    <time className="text-xs tabular-nums text-muted-foreground" dateTime={event.created_at}>
                      {formatDateTime(event.created_at)}
                    </time>
                  </div>
                  <p className="text-sm">Por {event.actor?.display_name ?? "Ator sem nome"}</p>
                  <p className="text-sm text-muted-foreground">{summary}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/app/admin/audit/${event.id}`}>Ver evento</Link>
                  </Button>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
            <TableScrollArea bounded label="Tabela de auditoria">
              <Table className="min-w-full table-fixed xl:min-w-[1050px] xl:table-auto">
                <TableHeader className="lg:sticky lg:top-0 lg:z-10">
                  <TableRow>
                    <TableHead>Data/hora</TableHead>
                    <TableHead>Ator</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead className="text-right">Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(({ event, summary }) => (
                    <TableRow key={event.id} className="align-top">
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {formatDateTime(event.created_at)}
                        </TableCell>
                        <TableCell className="max-w-48">
                          <p className="truncate font-medium">
                            {event.actor?.display_name ?? "Ator sem nome"}
                          </p>
                          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                            {event.actor_user_id}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p>{AUDIT_ENTITY_LABELS[event.entity_type]}</p>
                          <p className="mt-1 max-w-40 truncate font-mono text-xs text-muted-foreground">
                            {event.entity_id}
                          </p>
                        </TableCell>
                        <TableCell>
                          {AUDIT_ACTION_LABELS[event.action]}
                        </TableCell>
                        <TableCell className="max-w-80 text-muted-foreground">
                          <span className="block truncate">{summary}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/app/admin/audit/${event.id}`}>
                              Ver
                            </Link>
                          </Button>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollArea>
            </div>
            <ListPagination
              currentPage={result.page}
              getHref={(targetPage) => paginationHref(filters, targetPage)}
              getPageSizeHref={(targetSize) => paginationHref(filters, 1, targetSize)}
              label="auditoria"
              pageCount={result.pageCount}
              pageSize={result.pageSize}
              total={result.total}
            />
          </section>
          </ListPendingSurface>
        )}
        </AuditListFilterBar>
      </ContentContainer>
    </PageShell>
    </ListNavigationProvider>
  );
}
