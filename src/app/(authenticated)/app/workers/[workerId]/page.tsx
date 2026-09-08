import { Pencil, Plus } from "lucide-react";
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
import { can, getAuthorizationContext, PermissionGate } from "@/modules/authorization";
import {
  getWorkerAccessAdministration,
  WorkerAccessAdministrationPanel,
} from "@/modules/worker-access";
import {
  formatCpf,
  getWorkerOperationalDetail,
  WorkerStatusAction,
  WorkerStatusBadge,
  workerIdSchema,
} from "@/modules/workers";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

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
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function WorkerDetailsPage({
  params,
}: PageProps<"/app/workers/[workerId]">) {
  const route = workerIdSchema.safeParse((await params).workerId);
  if (!route.success) notFound();

  let detail;
  try {
    detail = await getWorkerOperationalDetail(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();

    return (
      <PageShell>
        <ContentContainer size="detail-wide">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[
                  { label: "Pessoas" },
                  { label: "Colaboradores", href: "/app/workers" },
                ]}
              />
            }
            title="Detalhe do colaborador"
          />
          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const { worker, assignments, activeAssignment } = detail;
  const authorization = await getAuthorizationContext();
  const workerAccess = can(authorization, "worker_access:read")
    ? await getWorkerAccessAdministration(worker.id)
    : null;

  return (
    <PageShell>
      <ContentContainer size="detail-wide">
        <PageHeader
          actions={
            <PermissionGate permission="worker:update">
              <Button asChild variant="outline">
                <Link href={"/app/workers/" + worker.id + "/edit"}>
                  <Pencil aria-hidden="true" className="size-4" />
                  Editar
                </Link>
              </Button>
            </PermissionGate>
          }
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Pessoas" },
                { label: "Colaboradores", href: "/app/workers" },
                { label: worker.full_name },
              ]}
            />
          }
          description="Dados cadastrais e contexto operacional do colaborador."
          metadata={
            <div className="flex flex-wrap items-center gap-3">
              <WorkerStatusBadge status={worker.status} />
              <span className="tabular-nums">
                CPF {formatCpf(worker.document_number)}
              </span>
            </div>
          }
          title={worker.full_name}
        />

        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <DetailSection
            description="Registro operacional da pessoa; não representa uma conta de acesso ao sistema."
            id="worker-data"
            title="Dados do colaborador"
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                label="E-mail"
                value={worker.email ?? "Não informado"}
              />
              <DetailItem
                label="Telefone"
                value={worker.phone ?? "Não informado"}
              />
              <DetailItem
                label="Início do vínculo"
                value={formatDate(worker.engagement_start_date)}
              />
              <DetailItem
                label="Fim do vínculo"
                value={formatDate(worker.engagement_end_date)}
              />
            </dl>
          </DetailSection>

          {workerAccess ? (
            <DetailSection
              description="Identidade de acesso do Pulsa Worker. Este vínculo não cria membership interno."
              id="worker-access"
              title="Acesso ao Pulsa Worker"
            >
              <WorkerAccessAdministrationPanel
                access={workerAccess}
                workerId={worker.id}
              />
            </DetailSection>
          ) : null}

          <DetailSection
            description="A alocação registra a relação temporal vigente entre o colaborador e um posto."
            id="current-assignment"
            title="Alocação atual"
          >
            {activeAssignment ? (
              <>
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Cargo"
                    value={activeAssignment.position.job_role.name}
                  />
                  <DetailItem
                    label="Unidade"
                    value={
                      <Link
                        className={relationLinkClass}
                        href={"/app/units/" + activeAssignment.position.unit.id}
                      >
                        {activeAssignment.position.unit.name}
                      </Link>
                    }
                  />
                  <DetailItem
                    label="Operação"
                    value={
                      <Link
                        className={relationLinkClass}
                        href={
                          "/app/operations/" +
                          activeAssignment.position.unit.operation.id
                        }
                      >
                        {activeAssignment.position.unit.operation.name}
                      </Link>
                    }
                  />
                  <DetailItem
                    label="Cliente"
                    value={
                      <Link
                        className={relationLinkClass}
                        href={
                          "/app/clients/" +
                          activeAssignment.position.unit.operation.contract
                            .client.id
                        }
                      >
                        {
                          activeAssignment.position.unit.operation.contract
                            .client.trade_name
                        }
                      </Link>
                    }
                  />
                  <DetailItem
                    label="Período"
                    value={
                      formatDate(activeAssignment.start_date) +
                      " — " +
                      formatDate(activeAssignment.end_date)
                    }
                  />
                </dl>
                <nav
                  aria-label="Relações da alocação atual"
                  className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border-default pt-4 text-sm"
                >
                  <Link
                    className={relationLinkClass}
                    href={"/app/assignments/" + activeAssignment.id}
                  >
                    Ver alocação
                  </Link>
                  <Link
                    className={relationLinkClass}
                    href={"/app/positions/" + activeAssignment.position.id}
                  >
                    Ver posto
                  </Link>
                </nav>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este colaborador não possui alocação ativa.
              </p>
            )}
          </DetailSection>

          <DetailSection
            actions={
              worker.status === "active" ? (
                <PermissionGate permission="assignment:create">
                  <Button asChild size="sm">
                    <Link href={"/app/assignments/new?workerId=" + worker.id}>
                      <Plus aria-hidden="true" className="size-4" />
                      Nova alocação
                    </Link>
                  </Button>
                </PermissionGate>
              ) : null
            }
            description="Relações anteriores e vigentes, da mais recente para a mais antiga."
            id="assignment-history"
            title="Histórico de alocações"
          >
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma alocação relacionada.
              </p>
            ) : (
              <ul className="divide-y divide-border-default">
                {assignments.map((assignment) => (
                  <li
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    key={assignment.id}
                  >
                    <div className="min-w-0">
                      <Link
                        className={relationLinkClass}
                        href={"/app/assignments/" + assignment.id}
                      >
                        {assignment.position.job_role.name}
                      </Link>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        <Link
                          className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                          href={"/app/units/" + assignment.position.unit.id}
                        >
                          {assignment.position.unit.name}
                        </Link>
                        <span aria-hidden="true"> · </span>
                        <Link
                          className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                          href={
                            "/app/operations/" +
                            assignment.position.unit.operation.id
                          }
                        >
                          {assignment.position.unit.operation.name}
                        </Link>
                        <span aria-hidden="true"> · </span>
                        {formatDate(assignment.start_date)} —{" "}
                        {formatDate(assignment.end_date)}
                      </p>
                    </div>
                    <AssignmentStatusBadge status={assignment.status} />
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <PermissionGate permission="worker:update">
            <DetailSection
              description="Altere somente a situação do colaborador. O histórico operacional é preservado."
              id="worker-status-actions"
              title="Situação do colaborador"
            >
              <WorkerStatusAction
                currentStatus={worker.status}
                workerId={worker.id}
              />
            </DetailSection>
          </PermissionGate>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
