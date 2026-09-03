import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { AssignmentStatusBadge } from "@/modules/assignments";
import { PermissionGate } from "@/modules/authorization";
import {
  getPositionOperationalDetail,
  positionIdSchema,
  PositionStatusAction,
  PositionStatusBadge,
} from "@/modules/positions";
import { unitIdSchema } from "@/modules/units";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

const relationLinkClass =
  "rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function formatDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(value + "T00:00:00Z"),
      )
    : "Em aberto";
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6">{value}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function DetailSection({
  id,
  title,
  description,
  actions,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold" id={id}>
            {title}
          </h2>

          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-0">
            {actions}
          </div>
        ) : null}
      </header>

      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function PositionDetailsPage({
  params,
}: PageProps<"/app/units/[unitId]/positions/[positionId]">) {
  const values = await params;

  const unitId = unitIdSchema.safeParse(values.unitId);
  const positionId = positionIdSchema.safeParse(values.positionId);

  if (!unitId.success || !positionId.success) notFound();

  let detail;

  try {
    detail = await getPositionOperationalDetail(positionId.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();

    return (
      <PageShell>
        <ContentContainer size="detail-wide">
          <PageHeader eyebrow="Postos" title="Detalhe do posto" />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const { position, assignments, activeAssignments, occupancy } = detail;

  if (position.unit.id !== unitId.data) notFound();

  const historicalAssignments = assignments.filter(
    (assignment) => assignment.status !== "active",
  );

  return (
    <PageShell>
      <ContentContainer size="detail-wide">
        <Button asChild size="sm" variant="ghost">
          <Link href={`/app/units/${unitId.data}`}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar para unidade
          </Link>
        </Button>

        <PageHeader
          actions={
            <PermissionGate permission="position:update">
              <Button asChild variant="outline">
                <Link
                  href={`/app/units/${unitId.data}/positions/${position.id}/edit`}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                  Editar
                </Link>
              </Button>
            </PermissionGate>
          }
          className="mt-5 sm:mt-6"
          description="Estrutura operacional, ocupação e alocações relacionadas ao posto."
          eyebrow="Postos"
          metadata={
            <div className="flex flex-wrap items-center gap-3">
              <PositionStatusBadge status={position.status} />

              <span>
                Unidade:{" "}
                <Link
                  className={relationLinkClass}
                  href={`/app/units/${position.unit.id}`}
                >
                  {position.unit.name}
                </Link>
              </span>
            </div>
          }
          title={position.job_role.name}
        />

        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <DetailSection
            description="Informações que definem onde este posto está inserido na estrutura operacional."
            id="position-context"
            title="Contexto operacional"
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Cargo" value={position.job_role.name} />

              <DetailItem
                label="Unidade"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/units/${position.unit.id}`}
                  >
                    {position.unit.name}
                  </Link>
                }
              />

              <DetailItem
                label="Operação"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/operations/${position.unit.operation.id}`}
                  >
                    {position.unit.operation.name}
                  </Link>
                }
              />

              <DetailItem
                label="Cliente"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/clients/${position.unit.operation.contract.client.id}`}
                  >
                    {position.unit.operation.contract.client.trade_name}
                  </Link>
                }
              />
            </dl>

            {position.description ? (
              <div className="mt-6 border-t border-border-default pt-5">
                <dl>
                  <DetailItem label="Descrição" value={position.description} />
                </dl>
              </div>
            ) : null}
          </DetailSection>

          <DetailSection
            description="Relação estrutural entre o efetivo base definido para o posto e as alocações ativas."
            id="position-occupancy"
            title="Efetivo e ocupação"
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
              <Metric
                label="Efetivo base"
                value={occupancy.baseRequiredHeadcount}
              />

              <Metric
                label="Efetivo alocado"
                value={occupancy.activeAssignments}
              />

              <Metric label="Déficit" value={occupancy.deficit} />
            </dl>
          </DetailSection>

          <DetailSection
            actions={
              position.status === "active" ? (
                <PermissionGate permission="assignment:create">
                  <Button asChild className="w-fit" size="sm">
                    <Link
                      href={`/app/assignments/new?positionId=${position.id}`}
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      Nova alocação
                    </Link>
                  </Button>
                </PermissionGate>
              ) : null
            }
            description="Alocações atualmente vigentes neste posto."
            id="active-assignments"
            title="Alocações ativas"
          >
            {activeAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este posto não possui alocações ativas.
              </p>
            ) : (
              <AssignmentList assignments={activeAssignments} />
            )}
          </DetailSection>

          <DetailSection
            description="Alocações anteriores relacionadas a este posto."
            id="assignment-history"
            title="Histórico de alocações"
          >
            {historicalAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Não há histórico adicional de alocações.
              </p>
            ) : (
              <AssignmentList assignments={historicalAssignments} />
            )}
          </DetailSection>

          <PermissionGate permission="position:update">
            <DetailSection
              description="Altere somente a situação do posto. As relações e o histórico operacional são preservados."
              id="position-status-actions"
              title="Situação do posto"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Situação atual
                  </span>

                  <PositionStatusBadge status={position.status} />
                </div>

                <PositionStatusAction
                  currentStatus={position.status}
                  positionId={position.id}
                />
              </div>
            </DetailSection>
          </PermissionGate>
        </div>
      </ContentContainer>
    </PageShell>
  );
}

function AssignmentList({
  assignments,
}: {
  assignments: Awaited<
    ReturnType<typeof getPositionOperationalDetail>
  >["assignments"];
}) {
  return (
    <ul className="divide-y divide-border-default">
      {assignments.map((assignment) => (
        <li
          className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          key={assignment.id}
        >
          <div className="min-w-0">
            <Link
              className={relationLinkClass}
              href={`/app/workers/${assignment.worker.id}`}
            >
              {assignment.worker.full_name}
            </Link>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {formatDate(assignment.start_date)} —{" "}
              {formatDate(assignment.end_date)}
              <span aria-hidden="true"> · </span>
              <Link
                className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                href={`/app/assignments/${assignment.id}`}
              >
                Ver alocação
              </Link>
            </p>
          </div>

          <div className="w-fit self-start sm:self-auto">
            <AssignmentStatusBadge status={assignment.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}
