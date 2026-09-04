import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/table";
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
  return (
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
        <form
          className="mt-6 grid gap-3 rounded-surface border border-border-default bg-surface p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_1.2fr_1.4fr_auto]"
          method="get"
        >
          <Field id="audit-from" label="De">
            <Input defaultValue={filters.from} name="from" type="date" />
          </Field>
          <Field id="audit-to" label="Até">
            <Input defaultValue={filters.to} name="to" type="date" />
          </Field>
          <Field id="audit-entity" label="Entidade">
            <Select defaultValue={filters.entityType ?? ""} name="entityType">
              <option value="">Todas</option>
              {AUDIT_ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {AUDIT_ENTITY_LABELS[type]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="audit-action" label="Ação">
            <Select defaultValue={filters.action ?? ""} name="action">
              <option value="">Todas</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {AUDIT_ACTION_LABELS[action]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="audit-actor" label="Ator">
            <Select defaultValue={filters.actorId ?? ""} name="actorId">
              <option value="">Todos</option>
              {members.map((member) => (
                <option key={member.profile_id} value={member.profile_id}>
                  {member.profile?.display_name ?? member.profile_id}
                </option>
              ))}
            </Select>
          </Field>
          <Button className="self-end" type="submit" variant="outline">
            <Search aria-hidden="true" className="size-4" />
            Filtrar
          </Button>
        </form>
        <div className="mt-5 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            {result.total} {result.total === 1 ? "evento" : "eventos"}
          </p>
          <p>
            Página {result.page} de {result.pageCount}
          </p>
        </div>
        {result.items.length === 0 ? (
          <section className="mt-4 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
            <h2 className="font-medium">Nenhum evento encontrado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajuste os filtros ou consulte outro período.
            </p>
          </section>
        ) : (
          <TableFrame className="mt-4">
            <TableScrollArea label="Tabela de auditoria">
              <Table className="min-w-full table-fixed xl:min-w-[1050px] xl:table-auto">
                <TableHeader>
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
                  {result.items.map((event) => {
                    const metadata = readAuditMetadata(event.metadata);
                    const summary =
                      metadata.changes.length > 0
                        ? metadata.changes
                            .map(
                              (field) =>
                                ({
                                  description: "Descrição",
                                  name: "Nome",
                                  status: "Status",
                                  role: "Papel",
                                })[field] ?? field,
                            )
                            .join(", ")
                        : "Sem campos resumidos";
                    return (
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableScrollArea>
          </TableFrame>
        )}
        <nav
          aria-label="Paginação da auditoria"
          className="mt-6 flex items-center justify-between"
        >
          {result.page > 1 ? (
            <Button asChild variant="outline">
              <Link href={paginationHref(filters, result.page - 1)}>
                <ArrowLeft aria-hidden="true" className="size-4" />
                Anterior
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {result.page < result.pageCount ? (
            <Button asChild variant="outline">
              <Link href={paginationHref(filters, result.page + 1)}>
                Próxima
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          ) : null}
        </nav>
      </ContentContainer>
    </PageShell>
  );
}
