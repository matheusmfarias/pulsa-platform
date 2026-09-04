import { ArrowRight, Pencil, Plus } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/table";
import { AssignmentStatusBadge } from "@/modules/assignments";
import { PermissionGate } from "@/modules/authorization";
import { PositionStatusBadge } from "@/modules/positions";
import {
  getUnitOperationalDetail,
  UnitStatusAction,
  UnitStatusBadge,
  unitIdSchema,
} from "@/modules/units";
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
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

export default async function UnitDetailsPage({
  params,
}: PageProps<"/app/units/[unitId]">) {
  const route = unitIdSchema.safeParse((await params).unitId);

  if (!route.success) notFound();

  let unit;

  try {
    unit = await getUnitOperationalDetail(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();

    return (
      <PageShell>
        <ContentContainer size="detail-wide">
          <PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Unidades", href: "/app/units" }]} />} title="Detalhe da unidade" />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const location =
    [unit.address, unit.city, unit.state].filter(Boolean).join(" · ") ||
    "Não informada";

  return (
    <PageShell>
      <ContentContainer size="detail-wide">
        <PageHeader
          actions={
            <PermissionGate permission="unit:update">
              <Button asChild variant="outline">
                <Link href={`/app/units/${unit.id}/edit`}>
                  <Pencil aria-hidden="true" className="size-4" />
                  Editar
                </Link>
              </Button>
            </PermissionGate>
          }
          breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Unidades", href: "/app/units" }, { label: unit.name }]} />}
          description="Estrutura, efetivo e relações operacionais desta unidade."
          metadata={
            <div className="flex flex-wrap items-center gap-3">
              <UnitStatusBadge status={unit.status} />

              <span>
                Operação:{" "}
                <Link
                  className={relationLinkClass}
                  href={`/app/operations/${unit.operation.id}`}
                >
                  {unit.operation.name}
                </Link>
              </span>
            </div>
          }
          title={unit.name}
        />

        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <DetailSection
            description="Informações que identificam a unidade e sua posição na estrutura operacional."
            id="unit-context"
            title="Contexto operacional"
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                label="Operação"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/operations/${unit.operation.id}`}
                  >
                    {unit.operation.name}
                  </Link>
                }
              />

              <DetailItem
                label="Cliente"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/clients/${unit.operation.contract.client.id}`}
                  >
                    {unit.operation.contract.client.trade_name}
                  </Link>
                }
              />

              <DetailItem label="Código" value={unit.code ?? "Não informado"} />

              <DetailItem label="Fuso horário" value={unit.timezone} />
            </dl>

            <div className="mt-6 border-t border-border-default pt-5">
              <dl>
                <DetailItem label="Localização" value={location} />
              </dl>
            </div>
          </DetailSection>

          <DetailSection
            description="Resumo estrutural dos postos e do efetivo definido para esta unidade."
            id="unit-summary"
            title="Estrutura e efetivo"
          >
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
              <Metric
                label="Postos ativos"
                value={unit.summary.activePositions}
              />

              <Metric label="Cargos em uso" value={unit.summary.usedJobRoles} />

              <Metric
                label="Efetivo base"
                value={unit.summary.baseRequiredHeadcount}
              />

              <Metric
                label="Efetivo alocado"
                value={unit.summary.activeAssignments}
              />

              <Metric label="Déficit" value={unit.summary.deficit} />
            </dl>
          </DetailSection>

          <DetailSection
            actions={
              unit.status === "active" ? (
                <PermissionGate permission="position:create">
                  <Button asChild className="w-fit" size="sm">
                    <Link href={`/app/units/${unit.id}/positions/new`}>
                      <Plus aria-hidden="true" className="size-4" />
                      Novo posto
                    </Link>
                  </Button>
                </PermissionGate>
              ) : null
            }
            description="Postos estruturais vinculados a esta unidade."
            id="unit-positions"
            title="Postos"
          >
            {unit.positions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esta unidade ainda não possui postos cadastrados.
              </p>
            ) : (
              <TableFrame>
                <TableScrollArea label="Postos da unidade">
                  <Table className="min-w-full table-fixed lg:min-w-[720px] lg:table-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-3 lg:px-4">Posto</TableHead>

                        <TableHead className="hidden lg:table-cell">
                          Efetivo base
                        </TableHead>

                        <TableHead className="hidden lg:table-cell">
                          Efetivo alocado
                        </TableHead>

                        <TableHead className="hidden lg:table-cell">
                          Déficit
                        </TableHead>

                        <TableHead className="w-28 px-2 lg:w-32 lg:px-4">
                          Status
                        </TableHead>

                        <TableHead className="w-12 px-1 text-right lg:w-14 lg:px-4">
                          <span className="sr-only">Ações</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {unit.positions.map((position) => {
                        const href = `/app/units/${unit.id}/positions/${position.id}`;

                        return (
                          <TableRow key={position.id}>
                            <TableCell className="min-w-0 px-3 font-medium lg:px-4">
                              <Link
                                className={
                                  relationLinkClass + " block truncate"
                                }
                                href={href}
                                title={position.job_role.name}
                              >
                                {position.job_role.name}
                              </Link>

                              <div className="mt-2 space-y-1 font-normal text-xs tabular-nums text-muted-foreground lg:hidden">
                                <p>
                                  Efetivo base{" "}
                                  <span className="font-medium text-foreground">
                                    {position.base_required_headcount}
                                  </span>
                                </p>

                                <p>
                                  Efetivo alocado{" "}
                                  <span className="font-medium text-foreground">
                                    {position.activeAssignments}
                                  </span>
                                </p>

                                <p>
                                  Déficit{" "}
                                  <span className="font-medium text-foreground">
                                    {position.deficit}
                                  </span>
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="hidden tabular-nums lg:table-cell">
                              {position.base_required_headcount}
                            </TableCell>

                            <TableCell className="hidden tabular-nums lg:table-cell">
                              {position.activeAssignments}
                            </TableCell>

                            <TableCell className="hidden tabular-nums lg:table-cell">
                              {position.deficit}
                            </TableCell>

                            <TableCell className="px-2 lg:px-4">
                              <PositionStatusBadge status={position.status} />
                            </TableCell>

                            <TableCell className="px-1 text-right lg:px-4">
                              <Button asChild size="icon" variant="ghost">
                                <Link
                                  aria-label={`Ver detalhes do posto ${position.job_role.name}`}
                                  href={href}
                                  title="Ver detalhes"
                                >
                                  <ArrowRight
                                    aria-hidden="true"
                                    className="size-4"
                                  />
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
          </DetailSection>

          <DetailSection
            description="Colaboradores com alocação ativa em algum posto desta unidade."
            id="allocated-workers"
            title="Colaboradores alocados"
          >
            {unit.allocatedWorkers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Não há colaboradores com alocação ativa nesta unidade.
              </p>
            ) : (
              <ul className="divide-y divide-border-default">
                {unit.allocatedWorkers.map((assignment) => (
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
                        {assignment.position.job_role.name}
                        <span aria-hidden="true"> · </span>
                        desde {formatDate(assignment.start_date)}
                      </p>

                      <nav
                        aria-label={`Relações da alocação de ${assignment.worker.full_name}`}
                        className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm"
                      >
                        <Link
                          className={relationLinkClass}
                          href={`/app/units/${unit.id}/positions/${assignment.position.id}`}
                        >
                          Ver posto
                        </Link>

                        <Link
                          className={relationLinkClass}
                          href={`/app/assignments/${assignment.id}`}
                        >
                          Ver alocação
                        </Link>
                      </nav>
                    </div>

                    <div className="w-fit self-start sm:self-auto">
                      <AssignmentStatusBadge status={assignment.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <PermissionGate permission="unit:update">
            <DetailSection
              description="Altere somente a situação da unidade. As relações operacionais existentes são preservadas."
              id="unit-status-actions"
              title="Situação da unidade"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Situação atual
                  </span>

                  <UnitStatusBadge status={unit.status} />
                </div>

                <UnitStatusAction
                  currentStatus={unit.status}
                  unitId={unit.id}
                />
              </div>
            </DetailSection>
          </PermissionGate>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
