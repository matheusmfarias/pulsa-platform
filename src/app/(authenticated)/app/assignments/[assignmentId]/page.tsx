import { ArrowLeft, Pencil } from "lucide-react";
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
import {
  assignmentIdSchema,
  AssignmentStatusAction,
  AssignmentStatusBadge,
  getAssignmentById,
} from "@/modules/assignments";
import { PermissionGate } from "@/modules/authorization";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

const relationLinkClass =
  "rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function formatDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: "UTC",
      }).format(new Date(value + "T00:00:00Z"))
    : "Em aberto";
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 text-sm leading-6">
        {value}
      </dd>
    </div>
  );
}

function DetailSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="py-6">
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

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

export default async function AssignmentDetailsPage({
  params,
}: PageProps<"/app/assignments/[assignmentId]">) {
  const route = assignmentIdSchema.safeParse(
    (await params).assignmentId,
  );

  if (!route.success) {
    notFound();
  }

  let assignment;

  try {
    assignment = await getAssignmentById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <PageShell>
        <ContentContainer size="detail">
          <PageHeader
            eyebrow="Alocações"
            title="Detalhe da alocação"
          />

          <FeedbackMessage
            className="mt-6"
            variant="danger"
          >
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const positionHref =
    `/app/units/${assignment.position.unit.id}` +
    `/positions/${assignment.position.id}`;

  return (
    <PageShell>
      <ContentContainer size="detail">
        <Button asChild size="sm" variant="ghost">
          <Link href="/app/assignments">
            <ArrowLeft
              aria-hidden="true"
              className="size-4"
            />
            Voltar para alocações
          </Link>
        </Button>

        <PageHeader
          actions={
            <PermissionGate permission="assignment:update">
              <Button asChild variant="outline">
                <Link
                  href={`/app/assignments/${assignment.id}/edit`}
                >
                  <Pencil
                    aria-hidden="true"
                    className="size-4"
                  />
                  Editar
                </Link>
              </Button>
            </PermissionGate>
          }
          className="mt-5 sm:mt-6"
          description="Vínculo temporal entre colaborador e posto."
          eyebrow="Alocações"
          metadata={
            <div className="flex flex-wrap items-center gap-3">
              <AssignmentStatusBadge
                status={assignment.status}
              />

              <span>
                Posto:{" "}
                <Link
                  className={relationLinkClass}
                  href={positionHref}
                >
                  {assignment.position.job_role.name}
                </Link>
              </span>
            </div>
          }
          title={assignment.worker.full_name}
        />

        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <DetailSection
            description="Relação operacional estabelecida entre o colaborador e o posto."
            id="assignment-relation"
            title="Vínculo operacional"
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailItem
                label="Colaborador"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/workers/${assignment.worker.id}`}
                  >
                    {assignment.worker.full_name}
                  </Link>
                }
              />

              <DetailItem
                label="Posto"
                value={
                  <Link
                    className={relationLinkClass}
                    href={positionHref}
                  >
                    {assignment.position.job_role.name}
                  </Link>
                }
              />

              <DetailItem
                label="Unidade"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/units/${assignment.position.unit.id}`}
                  >
                    {assignment.position.unit.name}
                  </Link>
                }
              />

              <DetailItem
                label="Operação"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/operations/${assignment.position.unit.operation.id}`}
                  >
                    {assignment.position.unit.operation.name}
                  </Link>
                }
              />
            </dl>

            <div className="mt-6 border-t border-border-default pt-5">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <DetailItem
                  label="Cliente"
                  value={
                    <Link
                      className={relationLinkClass}
                      href={`/app/clients/${assignment.position.unit.operation.contract.client.id}`}
                    >
                      {
                        assignment.position.unit.operation.contract.client
                          .trade_name
                      }
                    </Link>
                  }
                />

                <DetailItem
                  label="Contrato"
                  value={
                    <Link
                      className={relationLinkClass}
                      href={`/app/contracts/${assignment.position.unit.operation.contract.id}`}
                    >
                      {
                        assignment.position.unit.operation.contract
                          .name
                      }
                    </Link>
                  }
                />
              </dl>
            </div>
          </DetailSection>

          <DetailSection
            description="Período de vigência desta relação operacional."
            id="assignment-period"
            title="Período da alocação"
          >
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
              <DetailItem
                label="Data inicial"
                value={formatDate(assignment.start_date)}
              />

              <DetailItem
                label="Data final"
                value={formatDate(assignment.end_date)}
              />
            </dl>
          </DetailSection>

          <PermissionGate permission="assignment:update">
            <DetailSection
              description="Altere somente a situação da alocação. O vínculo e seu histórico permanecem preservados."
              id="assignment-status"
              title="Situação da alocação"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Situação atual
                  </span>

                  <AssignmentStatusBadge
                    status={assignment.status}
                  />
                </div>

                <div className="w-fit">
                  <AssignmentStatusAction
                    assignmentId={assignment.id}
                    currentStatus={assignment.status}
                  />
                </div>
              </div>
            </DetailSection>
          </PermissionGate>
        </div>
      </ContentContainer>
    </PageShell>
  );
}