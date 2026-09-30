import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailItem, DetailSection } from "@/components/layout/detail";
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
import { WorkerDetailTabs } from "@/modules/workers/components/worker-detail-tabs";

const relationLinkClass =
  "rounded-sm font-medium underline decoration-border-strong underline-offset-4 hover:decoration-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function formatDate(value: string | null, missingLabel = "Em aberto"): string {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(value + "T00:00:00Z"),
      )
    : missingLabel;
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
  const otherAssignments = assignments.filter(
    (assignment) => assignment.id !== activeAssignment?.id,
  );
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
          description="Local de trabalho, histórico e dados do vínculo."
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

        <WorkerDetailTabs tabs={[
          {
            id: "assignments",
            label: "Alocações",
            content: <div className="divide-y divide-border-default">
          <DetailSection
            actions={
              worker.status === "active" ? (
                <PermissionGate permission="assignment:create">
                  <Button asChild size="sm" variant={activeAssignment ? "outline" : "default"}>
                    <Link href={"/app/assignments/new?workerId=" + worker.id}>
                      <Plus aria-hidden="true" className="size-4" />
                      Nova alocação
                    </Link>
                  </Button>
                </PermissionGate>
              ) : null
            }
            description="Cargo e local de trabalho vinculados neste momento."
            id="current-assignment"
            title="Alocação atual"
          >
            {activeAssignment ? (
              <div className="rounded-r-surface border-l-4 border-action-primary bg-subtle px-5 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cargo atual
                </p>
                <p className="mt-1 text-xl font-semibold leading-tight tracking-tight">
                  {activeAssignment.position.job_role.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Na unidade{" "}
                  <Link
                    className={relationLinkClass + " text-foreground-default"}
                    href={"/app/units/" + activeAssignment.position.unit.id}
                  >
                    {activeAssignment.position.unit.name}
                  </Link>
                </p>
                <dl className="mt-6 grid gap-x-8 gap-y-5 border-t border-border-default pt-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Operação"
                    value={
                      <Link
                        className={relationLinkClass}
                        href={"/app/operations/" + activeAssignment.position.unit.operation.id}
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
                        href={"/app/clients/" + activeAssignment.position.unit.operation.contract.client.id}
                      >
                        {activeAssignment.position.unit.operation.contract.client.trade_name}
                      </Link>
                    }
                  />
                  <DetailItem
                    label="Período"
                    value={`${formatDate(activeAssignment.start_date)} — ${formatDate(activeAssignment.end_date)}`}
                  />
                </dl>
                <nav
                  aria-label="Relações da alocação atual"
                  className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border-default pt-4 text-sm"
                >
                  <Link className={relationLinkClass} href={"/app/assignments/" + activeAssignment.id}>
                    Ver detalhes da alocação
                  </Link>
                  <Link className={relationLinkClass} href={"/app/positions/" + activeAssignment.position.id}>
                    Ver posto
                  </Link>
                </nav>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este colaborador não possui alocação ativa.
              </p>
            )}
          </DetailSection>

          <DetailSection
            description={otherAssignments.length > 0 ? "Relações anteriores, da mais recente para a mais antiga." : undefined}
            id="assignment-history"
            title={`Histórico de alocações (${otherAssignments.length})`}
          >
            {otherAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Não há outras alocações para este colaborador.
              </p>
            ) : (
              <ul className="divide-y divide-border-default">
                {otherAssignments.map((assignment) => (
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
                          className={relationLinkClass}
                          href={"/app/units/" + assignment.position.unit.id}
                        >
                          {assignment.position.unit.name}
                        </Link>
                        <span aria-hidden="true"> · </span>
                        <Link
                          className={relationLinkClass}
                          href={
                            "/app/operations/" +
                            assignment.position.unit.operation.id
                          }
                        >
                          {assignment.position.unit.operation.name}
                        </Link>
                      </p>
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        {formatDate(assignment.start_date)} — {formatDate(assignment.end_date)}
                      </p>
                    </div>
                    <AssignmentStatusBadge status={assignment.status} />
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

            </div>,
          },
          {
            id: "record",
            label: "Cadastro",
            content: <div className="divide-y divide-border-default">
          <DetailSection
            description="Informações cadastrais e período do vínculo."
            id="worker-data"
            title="Dados do colaborador"
          >
            <div className="grid gap-7 lg:grid-cols-2 lg:gap-10">
              <div>
                <h3 className="mb-4 text-sm font-semibold">Contato</h3>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <DetailItem label="E-mail" value={<span className="break-all">{worker.email ?? "Não informado"}</span>} />
                  <DetailItem label="Telefone" value={worker.phone ?? "Não informado"} />
                </dl>
              </div>
              <div className="border-t border-border-default pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <h3 className="mb-4 text-sm font-semibold">Vínculo</h3>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <DetailItem label="Início" value={formatDate(worker.engagement_start_date, "Não informado")} />
                  <DetailItem
                    label="Fim"
                    value={formatDate(
                      worker.engagement_end_date,
                      worker.status === "terminated" ? "Não informado" : "Em aberto",
                    )}
                  />
                </dl>
              </div>
            </div>
          </DetailSection>

          {can(authorization, "worker:update") ? (
            <DetailSection
              description="Altere a situação cadastral. O histórico operacional permanece disponível."
              id="worker-status-actions"
              title="Situação do colaborador"
            >
              <WorkerStatusAction currentStatus={worker.status} workerId={worker.id} />
            </DetailSection>
          ) : null}
            </div>,
          },
          ...(workerAccess ? [{
            id: "access",
            label: "Acesso",
            content: <DetailSection
              description="Convite e acesso ao aplicativo em que o colaborador consulta a escala e registra presença."
              id="worker-access"
              title="Acesso ao Pulsa Worker"
            >
              <WorkerAccessAdministrationPanel
                access={workerAccess}
                workerEmail={worker.email}
                workerId={worker.id}
              />
            </DetailSection>,
          }] : []),
        ]} />
      </ContentContainer>
    </PageShell>
  );
}
