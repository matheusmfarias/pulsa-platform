import { connection } from "next/server";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { can, getAuthorizationContext } from "@/modules/authorization";
import { resolveOperationalContext } from "@/modules/operational-context";
import {
  listPresenceOperationalDay,
  presenceOperationalDateSchema,
  summarizeOperationalPresences,
} from "@/modules/presences";
import { PresenceDayNavigation } from "@/modules/presences/components/presence-day-navigation";
import { PresenceOperationalTable } from "@/modules/presences/components/presence-operational-table";
import { toPublicErrorMessage } from "@/shared/errors";

function currentDate() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

export default async function PresencesPage({
  searchParams,
}: PageProps<"/app/presences">) {
  await connection();
  const today = currentDate();
  const requestedDate = (await searchParams).date;
  const parsedDate = presenceOperationalDateSchema.safeParse(
    typeof requestedDate === "string" ? requestedDate : today,
  );

  if (!parsedDate.success) {
    return (
      <PageShell><ContentContainer size="list"><PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Presença" }]} />} description="Acompanhe o planejado e o realizado da operação." title="Presença" /><FeedbackMessage className="mt-6" variant="danger">Informe uma data válida no formato YYYY-MM-DD.</FeedbackMessage></ContentContainer></PageShell>
    );
  }

  let rows;
  let authorization;
  try {
    const [{ context }, resolvedAuthorization] = await Promise.all([
      resolveOperationalContext(),
      getAuthorizationContext(),
    ]);
    rows = await listPresenceOperationalDay(parsedDate.data, context);
    authorization = resolvedAuthorization;
  } catch (error) {
    return (
      <PageShell><ContentContainer size="list"><PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Presença" }]} />} description="Acompanhe o planejado e o realizado da operação." title="Presença" /><FeedbackMessage className="mt-6" variant="danger">{toPublicErrorMessage(error)}</FeedbackMessage></ContentContainer></PageShell>
    );
  }

  const summary = summarizeOperationalPresences(rows);
  const capabilities = {
    create: can(authorization, "presence:create"),
    update: can(authorization, "presence:update"),
    cancel: can(authorization, "presence:cancel"),
  };
  const cards = [
    ["Programados", summary.scheduled],
    ["Aguardando confirmação", summary.awaiting],
    ["Presentes", summary.present],
    ["Concluídos", summary.completed],
    ["Ausências sem cobertura", summary.uncovered],
  ] as const;

  return (
    <PageShell>
      <ContentContainer size="list">
        <PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Presença" }]} />} description="Acompanhe quem era esperado, quem compareceu e o que exige ação no dia." title="Presença" />
        <section className="mt-6" aria-label="Navegação por dia"><PresenceDayNavigation date={parsedDate.data} today={today} /></section>
        <section aria-label="Resumo operacional" className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {cards.map(([label, value]) => <article className="rounded-surface border border-border-default bg-surface p-4" key={label}><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></article>)}
        </section>
        <section className="mt-6" aria-labelledby="presence-list-title">
          <div><h2 className="font-semibold" id="presence-list-title">Acompanhamento do dia</h2><p className="mt-1 text-sm text-muted-foreground">Estados são derivados da escala oficial, ausências, coberturas e presenças válidas.</p></div>
          {rows.length ? <PresenceOperationalTable capabilities={capabilities} rows={rows} /> : <div className="mt-4 rounded-surface border border-dashed border-border-default px-6 py-10 text-center"><h3 className="font-medium">Nenhuma entrada programada</h3><p className="mt-2 text-sm text-muted-foreground">Não há trabalho planejado para esta data e contexto operacional.</p></div>}
        </section>
      </ContentContainer>
    </PageShell>
  );
}
