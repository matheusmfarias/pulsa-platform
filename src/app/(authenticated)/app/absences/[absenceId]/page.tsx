import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailItem, DetailSection } from "@/components/layout/detail";
import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  ABSENCE_REASON_LABELS,
  AbsenceCancelAction,
  AbsenceStatusBadge,
  absenceActionsFor,
  absenceIdSchema,
  getAbsenceDetailsById,
  isAbsenceWithoutCoverage,
} from "@/modules/absences";
import { getAuthorizationContext, ROLE_PERMISSIONS } from "@/modules/authorization";
import {
  listReplacementCandidates,
  ReplacementCancelControl,
  ReplacementDefinitionControl,
} from "@/modules/replacements";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

function formatDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export default async function AbsenceDetailsPage({
  params,
}: PageProps<"/app/absences/[absenceId]">) {
  const route = absenceIdSchema.safeParse((await params).absenceId);
  if (!route.success) notFound();

  let absence;
  let authorization;
  try {
    [absence, authorization] = await Promise.all([
      getAbsenceDetailsById(route.data),
      getAuthorizationContext(),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <PageShell>
        <ContentContainer size="detail">
          <PageHeader
            breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Ausências", href: "/app/absences" }]} />}
            title="Detalhe da ausência"
          />
          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const entry = absence.schedule_entry;
  const position = entry.assignment.position;
  const unit = position.unit;
  const scheduleId = entry.schedule_revision.schedule.id;
  const permissions = new Set(ROLE_PERMISSIONS[authorization.role]);
  const canCancel = absenceActionsFor(absence.status, permissions).includes("cancel");
  const activeReplacement = absence.replacements?.find(
    (replacement) => replacement.status === "active",
  );
  const canCreateReplacement =
    absence.status === "reported" &&
    !activeReplacement &&
    permissions.has("replacement:create");
  const canCancelReplacement =
    !!activeReplacement && permissions.has("replacement:cancel");
  const candidates = canCreateReplacement
    ? await listReplacementCandidates(absence.id)
    : [];

  return (
    <PageShell>
      <ContentContainer size="detail">
        <PageHeader
          actions={canCancel && !activeReplacement ? <AbsenceCancelAction absenceId={absence.id} scheduleId={scheduleId} /> : undefined}
          breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Ausências", href: "/app/absences" }, { label: entry.assignment.worker.full_name }]} />}
          description="Registro histórico associado à entrada planejada da escala."
          metadata={<AbsenceStatusBadge status={absence.status} />}
          title={entry.assignment.worker.full_name}
        />
        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <DetailSection id="absence-schedule-entry" title="Entrada de escala">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Colaborador" value={entry.assignment.worker.full_name} />
              <DetailItem
                label="ScheduleEntry"
                value={<Link className="underline-offset-4 hover:underline" href={`/app/scheduling/${scheduleId}`}>Ver na escala</Link>}
              />
              <DetailItem label="Operação" value={unit.operation.name} />
              <DetailItem label="Unidade" value={unit.name} />
              <DetailItem label="Posto" value={position.job_role.name} />
              <DetailItem
                label="Data e horário"
                value={`${formatDateTime(entry.starts_at, unit.timezone)} — ${formatDateTime(entry.ends_at, unit.timezone)}`}
              />
            </dl>
          </DetailSection>
          <DetailSection id="absence-record" title="Ausência">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Motivo" value={ABSENCE_REASON_LABELS[absence.reason]} />
              <DetailItem label="Observação" value={absence.notes || "—"} />
              <DetailItem label="Status" value={<AbsenceStatusBadge status={absence.status} />} />
              <DetailItem
                label="Registrada em"
                value={formatDateTime(absence.reported_at, "America/Sao_Paulo")}
              />
              <DetailItem
                label="Registrada por"
                value={absence.reporter.display_name || absence.reported_by}
              />
            </dl>
          </DetailSection>
          <DetailSection id="absence-replacement" title="Substituição">
            {isAbsenceWithoutCoverage(absence) ? <FeedbackMessage variant="warning">Esta ausência ainda não possui substituto definido.</FeedbackMessage> : null}
            {activeReplacement?.replacement_assignment ? (
              <div className="space-y-5">
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem label="Substituto" value={activeReplacement.replacement_assignment.worker.full_name} />
                  <DetailItem label="Posto" value={activeReplacement.replacement_assignment.position.job_role.name} />
                  <DetailItem label="Unidade" value={activeReplacement.replacement_assignment.position.unit.name} />
                  <DetailItem label="Data e horário" value={`${formatDateTime(entry.starts_at, unit.timezone)} — ${formatDateTime(entry.ends_at, unit.timezone)}`} />
                  <DetailItem label="Status" value="Ativa" />
                </dl>
                {canCancelReplacement ? <ReplacementCancelControl absenceId={absence.id} replacementId={activeReplacement.id} scheduleId={scheduleId} /> : null}
              </div>
            ) : canCreateReplacement ? (
              <div className="space-y-3"><p className="text-sm text-muted-foreground">Nenhum substituto definido para esta ausência.</p><ReplacementDefinitionControl absenceId={absence.id} candidates={candidates} scheduleId={scheduleId} /></div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum substituto definido.</p>
            )}
          </DetailSection>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
