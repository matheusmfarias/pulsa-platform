import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
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
  if (typeof value === "number" || typeof value === "boolean") return String(value);
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
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Evento de auditoria</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">{toPublicErrorMessage(error)}</p>
      </main>
    );
  }

  const metadata = readAuditMetadata(event.metadata);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/admin/audit"><ArrowLeft className="size-4" aria-hidden="true" />Voltar para auditoria</Link>
      </Button>

      <div className="mt-6">
        <p className="text-sm font-medium text-primary">Administração · Auditoria</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{AUDIT_ACTION_LABELS[event.action]} · {AUDIT_ENTITY_LABELS[event.entity_type]}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(event.created_at)}</p>
      </div>

      <section className="mt-8 rounded-lg border bg-card">
        <div className="border-b px-6 py-4"><h2 className="font-semibold">Contexto do evento</h2></div>
        <dl className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
          <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ator</dt><dd className="mt-2 text-sm">{event.actor?.display_name ?? "Ator sem nome"}</dd><dd className="mt-1 break-all font-mono text-xs text-muted-foreground">{event.actor_user_id}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Organização</dt><dd className="mt-2 text-sm">{event.organization?.trade_name ?? event.organization_id}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo de entidade</dt><dd className="mt-2 text-sm">{AUDIT_ENTITY_LABELS[event.entity_type]}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ID da entidade</dt><dd className="mt-2 break-all font-mono text-sm">{event.entity_id}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ação</dt><dd className="mt-2 text-sm">{AUDIT_ACTION_LABELS[event.action]}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Audit event ID</dt><dd className="mt-2 break-all font-mono text-sm">{event.id}</dd></div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border bg-card">
        <div className="border-b px-6 py-4"><h2 className="font-semibold">Mudanças</h2></div>
        {metadata.changes.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">O evento não possui campos resumidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Campo</th><th className="px-5 py-3 font-medium">Antes</th><th className="px-5 py-3 font-medium">Depois</th></tr></thead>
              <tbody className="divide-y">
                {metadata.changes.map((field) => <tr key={field} className="hover:bg-hover"><td className="px-5 py-4 text-sm font-medium">{auditFieldLabel(field)}</td><td className="px-5 py-4 text-muted-foreground">{readableValue(metadata.previousState[field])}</td><td className="px-5 py-4">{readableValue(metadata.newState[field])}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <details className="mt-6 rounded-lg border bg-card">
        <summary className="cursor-pointer px-6 py-4 font-medium">Metadata técnica</summary>
        <pre className="overflow-x-auto border-t bg-muted/35 p-6 text-xs leading-6">{JSON.stringify(event.metadata, null, 2)}</pre>
      </details>
    </main>
  );
}
