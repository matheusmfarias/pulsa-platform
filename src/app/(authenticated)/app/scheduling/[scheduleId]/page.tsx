import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { getAuthorizationContext, ROLE_PERMISSIONS } from "@/modules/authorization";
import { listAssignmentsForOperation, type AssignmentWithContext } from "@/modules/assignments";
import { getOperationById } from "@/modules/operations";
import { getSchedule, getScheduleRevisionWithEntries, listScheduleRevisions, resolveScheduleWeekStart, scheduleIdSchema, ScheduleRevisionActions, ScheduleStatusBadge, ScheduleWeekEditor, ScheduleWorkerView, selectScheduleWorkRevision, scheduleWeekDays } from "@/modules/scheduling";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function formatCivilDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-sm leading-6">{value}</dd></div>;
}

export default async function ScheduleDetailsPage({ params, searchParams }: PageProps<"/app/scheduling/[scheduleId]"> & { searchParams: Promise<{ week?: string; view?: string; day?: string; copy?: string }> }) {
  const route = scheduleIdSchema.safeParse((await params).scheduleId);
  if (!route.success) notFound();
  let schedule; let operation; let revisions; let authorization;
  try {
    [schedule, authorization] = await Promise.all([getSchedule(route.data), getAuthorizationContext()]);
    [operation, revisions] = await Promise.all([getOperationById(schedule.operation_id), listScheduleRevisions(schedule.id)]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return <PageShell><ContentContainer size="detail-wide"><PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Escalas", href: "/app/scheduling" }]} />} title="Detalhe da escala" /><FeedbackMessage className="mt-6" variant="danger">{toPublicErrorMessage(error)}</FeedbackMessage></ContentContainer></PageShell>;
  }
  const revision = selectScheduleWorkRevision(revisions);
  let revisionWithEntries; let assignments: AssignmentWithContext[] = [];
  try {
    if (revision) [revisionWithEntries, assignments] = await Promise.all([getScheduleRevisionWithEntries(revision.id), listAssignmentsForOperation(schedule.operation_id)]);
  } catch (error) {
    return <PageShell><ContentContainer size="detail-wide"><PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Escalas", href: "/app/scheduling" }]} />} title="Detalhe da escala" /><FeedbackMessage className="mt-6" variant="danger">{toPublicErrorMessage(error)}</FeedbackMessage></ContentContainer></PageShell>;
  }
  const permissions = new Set(ROLE_PERMISSIONS[authorization.role]);
  const query = await searchParams;
  const view = query.view === "day" || query.view === "worker" ? query.view : "weekly";
  const weekStart = resolveScheduleWeekStart(schedule.period_start, schedule.period_end, query.week);
  const weekLink = (week: string) => `/app/scheduling/${schedule.id}?view=weekly&week=${week}`;
  const selectedDay = query.day && /^\d{4}-\d{2}-\d{2}$/.test(query.day) && query.day >= schedule.period_start && query.day <= schedule.period_end ? query.day : schedule.period_start;
  const dayLink = (day: string) => `/app/scheduling/${schedule.id}?view=day&day=${day}`;
  const changeWeek = (days: number) => { const date = new Date(`${weekStart}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
  const previousWeek = changeWeek(-7) >= schedule.period_start ? weekLink(changeWeek(-7)) : null;
  const nextWeek = changeWeek(7) <= schedule.period_end ? weekLink(changeWeek(7)) : null;
  const changeDay = (days: number) => { const date = new Date(`${selectedDay}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
  const previousDay = changeDay(-1) >= schedule.period_start ? dayLink(changeDay(-1)) : null;
  const nextDay = changeDay(1) <= schedule.period_end ? dayLink(changeDay(1)) : null;
  const copySummary = query.copy?.match(/^(\d+)-(\d+)$/);
  const canCreateAbsence = permissions.has("absence:create");
  return <PageShell><ContentContainer size="detail-wide"><PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Escalas", href: "/app/scheduling" }, { label: `${formatCivilDate(schedule.period_start)} — ${formatCivilDate(schedule.period_end)}` }]} />} description="Revisões, programação semanal e lifecycle da escala." metadata={revision ? <div className="flex items-center gap-3"><ScheduleStatusBadge status={revision.status} /><span className="text-sm text-muted-foreground">Versão {revision.version}</span></div> : undefined} title="Escala" />
    {copySummary ? <FeedbackMessage className="mt-6" variant="success">Escala copiada: {copySummary[1]} {copySummary[1] === "1" ? "entrada criada" : "entradas criadas"}{copySummary[2] === "0" ? "." : `; ${copySummary[2]} ${copySummary[2] === "1" ? "entrada ficou de fora por não estar elegível" : "entradas ficaram de fora por não estarem elegíveis"}.`}</FeedbackMessage> : null}
    <div className="mt-8 divide-y divide-border-default border-y border-border-default">
      <section className="py-6"><h2 className="font-semibold">Resumo</h2><dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4"><Item label="Operação" value={operation.name} /><Item label="Período" value={`${formatCivilDate(schedule.period_start)} — ${formatCivilDate(schedule.period_end)}`} /><Item label="Revisão exibida" value={revision ? `v${revision.version}` : "Sem revisão"} /><Item label="Entradas" value={revisionWithEntries?.entries.length ?? 0} /></dl></section>
      {revision && revisionWithEntries ? <><nav aria-label="Visualização da programação" className="flex gap-2 py-4"><Button asChild size="sm" variant={view === "weekly" ? "default" : "outline"}><Link href={weekLink(weekStart)}>Semanal</Link></Button><Button asChild size="sm" variant={view === "day" ? "default" : "outline"}><Link href={dayLink(selectedDay)}>Dia</Link></Button><Button asChild size="sm" variant={view === "worker" ? "default" : "outline"}><Link href={`/app/scheduling/${schedule.id}?view=worker`}>Colaborador</Link></Button></nav>{view === "weekly" ? <ScheduleWeekEditor assignments={assignments} canCreateAbsence={canCreateAbsence} entries={revisionWithEntries.entries} initialHref={weekLink(resolveScheduleWeekStart(schedule.period_start, schedule.period_end))} nextHref={nextWeek} periodEnd={schedule.period_end} periodStart={schedule.period_start} previousHref={previousWeek} revisionId={revision.id} scheduleId={schedule.id} status={revision.status} weekStart={weekStart} /> : null}{view === "day" ? <ScheduleWeekEditor assignments={assignments} canCreateAbsence={canCreateAbsence} days={scheduleWeekDays(selectedDay).filter((day) => day.key === selectedDay)} entries={revisionWithEntries.entries} initialHref={dayLink(schedule.period_start)} initialLabel="Início do período" nextHref={nextDay} nextLabel="Próximo dia" periodEnd={schedule.period_end} periodStart={schedule.period_start} previousHref={previousDay} previousLabel="Dia anterior" revisionId={revision.id} scheduleId={schedule.id} status={revision.status} title="Programação do dia" weekStart={selectedDay} /> : null}{view === "worker" ? <ScheduleWorkerView canCreateAbsence={canCreateAbsence} entries={revisionWithEntries.entries} scheduleId={schedule.id} /> : null}</> : null}
      {revision ? <section className="py-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-semibold">Lifecycle da revisão</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">As transições são revalidadas pelo domínio antes da conclusão.</p></div><ScheduleRevisionActions permissions={permissions} revisionId={revision.id} scheduleId={schedule.id} status={revision.status} /></div><dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3"><Item label="Enviada em" value={formatDate(revision.submitted_at)} /><Item label="Aprovada em" value={formatDate(revision.approved_at)} /><Item label="Publicada em" value={formatDate(revision.published_at)} /><Item label="Enviada por" value={revision.submitted_by ?? "—"} /><Item label="Aprovada por" value={revision.approved_by ?? "—"} /><Item label="Publicada por" value={revision.published_by ?? "—"} /></dl></section> : null}
      <section className="py-6"><h2 className="font-semibold">Histórico de revisões</h2><div className="mt-5 space-y-3">{revisions.map((item) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-surface border border-border-default px-4 py-3" key={item.id}><div><p className="font-medium">Versão {item.version}</p><p className="mt-1 text-sm text-muted-foreground">Criada em {formatDate(item.created_at)}</p></div><ScheduleStatusBadge status={item.status} /></div>)}</div></section>
    </div>
  </ContentContainer></PageShell>;
}
