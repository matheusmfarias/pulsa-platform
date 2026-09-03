import { ArrowLeft, ArrowRight, Pencil, Plus } from "lucide-react";
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
import { PermissionGate } from "@/modules/authorization";
import {
  getOperationOperationalDetail,
  operationIdSchema,
  OperationStatusAction,
  OperationStatusBadge,
} from "@/modules/operations";
import { UnitStatusBadge } from "@/modules/units";
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
      <dd className="mt-1 text-sm leading-6">{value}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
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

export default async function OperationDetailsPage({
  params,
}: PageProps<"/app/operations/[operationId]">) {
  const route = operationIdSchema.safeParse((await params).operationId);

  if (!route.success) notFound();

  let operation;

  try {
    operation = await getOperationOperationalDetail(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <PageShell>
        <ContentContainer size="detail-wide">
          <PageHeader
            eyebrow="Operações"
            title="Detalhe da operação"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ContentContainer size="detail-wide">
        <Button asChild size="sm" variant="ghost">
          <Link href="/app/operations">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar para operações
          </Link>
        </Button>

        <PageHeader
          actions={
            <PermissionGate permission="operation:update">
              <Button asChild variant="outline">
                <Link href={`/app/operations/${operation.id}/edit`}>
                  <Pencil aria-hidden="true" className="size-4" />
                  Editar
                </Link>
              </Button>
            </PermissionGate>
          }
          className="mt-5 sm:mt-6"
          description="Contexto contratual, estrutura e execução desta operação."
          eyebrow="Operações"
          metadata={
            <div className="flex flex-wrap items-center gap-3">
              <OperationStatusBadge status={operation.status} />

              <span>
                Cliente:{" "}
                <Link
                  className={relationLinkClass}
                  href={`/app/clients/${operation.contract.client.id}`}
                >
                  {operation.contract.client.trade_name}
                </Link>
              </span>
            </div>
          }
          title={operation.name}
        />

        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <DetailSection
            description="Informações que vinculam esta operação ao cliente e ao contrato de origem."
            id="operation-context"
            title="Contexto contratual"
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                label="Cliente"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/clients/${operation.contract.client.id}`}
                  >
                    {operation.contract.client.trade_name}
                  </Link>
                }
              />

              <DetailItem
                label="Contrato"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/contracts/${operation.contract.id}`}
                  >
                    {operation.contract.name}
                  </Link>
                }
              />

              <DetailItem
                label="Período"
                value={`${formatDate(operation.start_date)} — ${formatDate(
                  operation.end_date,
                )}`}
              />

              <DetailItem
                label="Gestor responsável"
                value={operation.manager?.display_name ?? "Não definido"}
              />
            </dl>

            {operation.description ? (
              <div className="mt-6 border-t border-border-default pt-5">
                <dl>
                  <DetailItem
                    label="Descrição"
                    value={operation.description}
                  />
                </dl>
              </div>
            ) : null}
          </DetailSection>

          <DetailSection
            description="Resumo estrutural das unidades, postos e efetivo vinculados a esta operação."
            id="operation-summary"
            title="Estrutura e efetivo"
          >
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
              <Metric
                label="Unidades ativas"
                value={operation.summary.activeUnits}
              />

              <Metric
                label="Postos ativos"
                value={operation.summary.activePositions}
              />

              <Metric
                label="Efetivo base"
                value={operation.summary.baseRequiredHeadcount}
              />

              <Metric
                label="Efetivo alocado"
                value={operation.summary.activeAssignments}
              />
            </dl>
          </DetailSection>

          <DetailSection
            actions={
              operation.status !== "closed" ? (
                <PermissionGate permission="unit:create">
                  <Button asChild className="w-fit" size="sm">
                    <Link href={`/app/units/new?operationId=${operation.id}`}>
                      <Plus aria-hidden="true" className="size-4" />
                      Nova unidade
                    </Link>
                  </Button>
                </PermissionGate>
              ) : null
            }
            description="Unidades operacionais vinculadas a esta operação."
            id="operation-units"
            title="Unidades"
          >
            {operation.units.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esta operação ainda não possui unidades cadastradas.
              </p>
            ) : (
              <TableFrame>
                <TableScrollArea label="Unidades da operação">
                  <Table className="min-w-full table-fixed lg:min-w-[760px] lg:table-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-3 lg:px-4">
                          Unidade
                        </TableHead>

                        <TableHead className="hidden lg:table-cell">
                          Postos ativos
                        </TableHead>

                        <TableHead className="hidden lg:table-cell">
                          Efetivo base
                        </TableHead>

                        <TableHead className="hidden lg:table-cell">
                          Efetivo alocado
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
                      {operation.units.map((unit) => {
                        const location =
                          [unit.city, unit.state]
                            .filter(Boolean)
                            .join(" / ") ||
                          unit.code ||
                          "Localização não informada";

                        return (
                          <TableRow key={unit.id}>
                            <TableCell className="min-w-0 px-3 font-medium lg:px-4">
                              <Link
                                className={relationLinkClass + " block truncate"}
                                href={`/app/units/${unit.id}`}
                                title={unit.name}
                              >
                                {unit.name}
                              </Link>

                              <p className="mt-1 truncate font-normal text-xs leading-5 text-muted-foreground">
                                {location}
                              </p>

                              <div className="mt-2 space-y-1 font-normal text-xs tabular-nums text-muted-foreground lg:hidden">
                                <p>
                                  {unit.activePositions}{" "}
                                  {unit.activePositions === 1
                                    ? "posto ativo"
                                    : "postos ativos"}
                                </p>

                                <p>
                                  Efetivo base{" "}
                                  <span className="font-medium text-foreground">
                                    {unit.baseRequiredHeadcount}
                                  </span>
                                </p>

                                <p>
                                  Efetivo alocado{" "}
                                  <span className="font-medium text-foreground">
                                    {unit.activeAssignments}
                                  </span>
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="hidden tabular-nums lg:table-cell">
                              {unit.activePositions}
                            </TableCell>

                            <TableCell className="hidden tabular-nums lg:table-cell">
                              {unit.baseRequiredHeadcount}
                            </TableCell>

                            <TableCell className="hidden tabular-nums lg:table-cell">
                              {unit.activeAssignments}
                            </TableCell>

                            <TableCell className="px-2 lg:px-4">
                              <UnitStatusBadge status={unit.status} />
                            </TableCell>

                            <TableCell className="px-1 text-right lg:px-4">
                              <Button asChild size="icon" variant="ghost">
                                <Link
                                  aria-label={`Ver detalhes da unidade ${unit.name}`}
                                  href={`/app/units/${unit.id}`}
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

          <PermissionGate permission="operation:update">
            <DetailSection
              description="Altere somente a situação da operação. As relações operacionais existentes são preservadas."
              id="operation-status-actions"
              title="Situação da operação"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Situação atual
                  </span>

                  <OperationStatusBadge status={operation.status} />
                </div>

                <OperationStatusAction
                  currentStatus={operation.status}
                  operationId={operation.id}
                />
              </div>
            </DetailSection>
          </PermissionGate>
        </div>
      </ContentContainer>
    </PageShell>
  );
}