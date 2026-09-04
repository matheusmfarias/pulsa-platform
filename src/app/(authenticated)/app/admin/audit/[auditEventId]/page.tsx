import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
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
  AUDIT_ENTITY_LABELS,
  auditEventIdSchema,
  getAuditEventById,
  readAuditMetadata,
} from "@/modules/administration";
import type { Json } from "@/shared/db/database.types";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
function readableValue(value: Json | undefined): string {
  if (value === undefined) return "—";
  if (value === null) return "Nulo";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}
const AUDIT_FIELD_LABELS: Record<string, string> = {
  description: "Descrição",
  name: "Nome",
  status: "Status",
  start_date: "Data de início",
  end_date: "Data de término",
  role: "Papel",
  full_name: "Nome completo",
};
function auditFieldLabel(field: string): string {
  return AUDIT_FIELD_LABELS[field] ?? field;
}

export default async function AuditEventDetailPage({
  params,
}: PageProps<"/app/admin/audit/[auditEventId]">) {
  const route = auditEventIdSchema.safeParse((await params).auditEventId);
  if (!route.success) notFound();
  let event;
  try {
    event = await getAuditEventById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <PageShell>
        <ContentContainer size="detail">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[{ label: "Administração" }, { label: "Auditoria" }]}
              />
            }
            title="Evento de auditoria"
          />
          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }
  const metadata = readAuditMetadata(event.metadata);
  return (
    <PageShell>
      <ContentContainer size="detail">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Administração" },
                { label: "Auditoria", href: "/app/admin/audit" },
                { label: "Evento" },
              ]}
            />
          }
          description={formatDateTime(event.created_at)}
          title={`${AUDIT_ACTION_LABELS[event.action]} · ${AUDIT_ENTITY_LABELS[event.entity_type]}`}
        />
        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <section className="py-6">
            <h2 className="font-semibold">Contexto do evento</h2>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ator
                </dt>
                <dd className="mt-1 text-sm">
                  {event.actor?.display_name ?? "Ator sem nome"}
                </dd>
                <dd className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {event.actor_user_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Organização
                </dt>
                <dd className="mt-1 text-sm">
                  {event.organization?.trade_name ?? event.organization_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tipo de entidade
                </dt>
                <dd className="mt-1 text-sm">
                  {AUDIT_ENTITY_LABELS[event.entity_type]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  ID da entidade
                </dt>
                <dd className="mt-1 break-all font-mono text-sm">
                  {event.entity_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ação
                </dt>
                <dd className="mt-1 text-sm">
                  {AUDIT_ACTION_LABELS[event.action]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Audit event ID
                </dt>
                <dd className="mt-1 break-all font-mono text-sm">{event.id}</dd>
              </div>
            </dl>
          </section>
          <section className="py-6">
            <h2 className="font-semibold">Mudanças</h2>
            {metadata.changes.length === 0 ? (
              <p className="mt-5 text-sm text-muted-foreground">
                O evento não possui campos resumidos.
              </p>
            ) : (
              <TableFrame className="mt-5">
                <TableScrollArea label="Mudanças do evento de auditoria">
                  <Table className="min-w-full table-fixed sm:min-w-[620px] sm:table-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campo</TableHead>
                        <TableHead>Antes</TableHead>
                        <TableHead>Depois</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metadata.changes.map((field) => (
                        <TableRow key={field}>
                          <TableCell className="font-medium">
                            {auditFieldLabel(field)}
                          </TableCell>
                          <TableCell className="break-words text-muted-foreground">
                            {readableValue(metadata.previousState[field])}
                          </TableCell>
                          <TableCell className="break-words">
                            {readableValue(metadata.newState[field])}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableScrollArea>
              </TableFrame>
            )}
          </section>
          <section className="py-6">
            <details className="rounded-surface border border-border-default bg-surface">
              <summary className="cursor-pointer px-6 py-4 font-medium">
                Metadata técnica
              </summary>
              <pre className="overflow-x-auto border-t border-border-default bg-subtle/35 p-6 text-xs leading-6">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </details>
          </section>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
