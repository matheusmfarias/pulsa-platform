import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Gauge,
  Link2,
  MapPin,
  UserRoundCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
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
import { resolveOperationalContext } from "@/modules/operational-context";
import { listAbsences } from "@/modules/absences";
import { getOperationalOverview } from "@/modules/overview/operational-overview";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function InternalHomePage() {
  let overview;
  let uncoveredAbsences;

  try {
    const { context } = await resolveOperationalContext();
    [overview, uncoveredAbsences] = await Promise.all([getOperationalOverview(context), listAbsences(context, { withoutCoverage: true, limit: 3 })]);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            description="Resumo da estrutura e das principais pendências operacionais."
            title="Visão geral"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            <p className="font-medium">
              Não foi possível carregar a visão geral.
            </p>

            <p className="mt-1">{toPublicErrorMessage(error)}</p>
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const {
    activeAssignments,
    totalRequiredHeadcount,
  } = overview.kpis;

  const rawOccupancyPercent =
    totalRequiredHeadcount > 0
      ? Math.round(
          (activeAssignments / totalRequiredHeadcount) * 100,
        )
      : 0;

  const progressValue = Math.min(rawOccupancyPercent, 100);

  const hasAttention =
    overview.attention.activeWorkersWithoutAssignment > 0 ||
    overview.attention.underfilledPositions > 0 || uncoveredAbsences.length > 0;

  const kpis = [
    {
      label: "Operações ativas",
      value: overview.kpis.activeOperations,
      icon: BriefcaseBusiness,
    },
    {
      label: "Unidades ativas",
      value: overview.kpis.activeUnits,
      icon: Building2,
    },
    {
      label: "Postos ativos",
      value: overview.kpis.activePositions,
      icon: MapPin,
    },
    {
      label: "Colaboradores ativos",
      value: overview.kpis.activeWorkers,
      icon: Users,
    },
    {
      label: "Alocações ativas",
      value: overview.kpis.activeAssignments,
      icon: Link2,
    },
    {
      label: "Efetivo base",
      value: totalRequiredHeadcount,
      icon: UserRoundCheck,
    },
  ] as const;

  return (
    <PageShell>
      <ContentContainer size="list">
        <PageHeader
          description="Resumo da estrutura e das principais pendências operacionais."
          title="Visão geral"
        />

        <section
          aria-labelledby="attention-heading"
          className="mt-6 overflow-hidden rounded-surface border border-border-default bg-surface"
        >
          <header className="flex items-center gap-2 border-b border-border-default px-4 py-3">
            <AlertTriangle
              aria-hidden="true"
              className={
                hasAttention
                  ? "size-4 text-warning"
                  : "size-4 text-muted-foreground"
              }
            />

            <div>
              <h2
                className="font-semibold"
                id="attention-heading"
              >
                Requer atenção
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Pendências que podem exigir ação operacional.
              </p>
            </div>
          </header>

          {hasAttention ? (
            <div className="divide-y divide-border-default px-4">
              {uncoveredAbsences.slice(0, 3).map((absence) => {
                const entry = absence.schedule_entry;
                const position = entry.assignment.position;
                const timeZone = position.unit.timezone;
                const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone }).format(new Date(entry.starts_at));
                return <Link className="group -mx-2 flex flex-col gap-1.5 rounded-md px-2 py-3 text-sm transition-colors hover:bg-hover" href={`/app/absences/${absence.id}`} key={absence.id}><span className="font-medium">Ausência sem cobertura · {entry.assignment.worker.full_name}</span><span className="text-xs text-muted-foreground">{when} · {position.unit.operation.name} · {position.unit.name} · {position.job_role.name}</span></Link>;
              })}
              {overview.attention.underfilledPositions > 0 ? (
                <Link
                  className="group -mx-2 flex flex-col gap-1.5 rounded-md px-2 py-3 text-sm font-medium transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  href="/app/positions"
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />

                    {overview.attention.underfilledPositions}{" "}
                    {overview.attention.underfilledPositions === 1
                      ? "posto abaixo do efetivo base"
                      : "postos abaixo do efetivo base"}
                  </span>

                  <span className="flex shrink-0 items-center gap-1 pl-6.5 text-xs text-muted-foreground group-hover:text-foreground sm:pl-0">
                    Ver postos

                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5"
                    />
                  </span>
                </Link>
              ) : null}

              {overview.attention.activeWorkersWithoutAssignment >
              0 ? (
                <Link
                  className="group -mx-2 flex flex-col gap-1.5 rounded-md px-2 py-3 text-sm font-medium transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  href="/app/workers"
                >
                  <span className="flex items-center gap-2.5">
                    <Users
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />

                    {
                      overview.attention
                        .activeWorkersWithoutAssignment
                    }{" "}
                    {overview.attention
                      .activeWorkersWithoutAssignment === 1
                      ? "colaborador ativo sem alocação ativa"
                      : "colaboradores ativos sem alocação ativa"}
                  </span>

                  <span className="flex shrink-0 items-center gap-1 pl-6.5 text-xs text-muted-foreground group-hover:text-foreground sm:pl-0">
                    Ver colaboradores

                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5"
                    />
                  </span>
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
              <CheckCircle2
                aria-hidden="true"
                className="size-4 text-success"
              />

              Nenhuma pendência operacional identificada.
            </p>
          )}
        </section>

        <section
          aria-labelledby="indicators-heading"
          className="mt-8"
        >
          <header>
            <h2
              className="font-semibold"
              id="indicators-heading"
            >
              Indicadores operacionais
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Estrutura ativa dentro do contexto selecionado.
            </p>
          </header>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(({ label, value, icon: Icon }) => (
              <article
                className="flex min-h-24 flex-col justify-between rounded-surface border border-border-default bg-surface px-4 py-3.5"
                key={label}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {label}
                  </p>

                  <Icon
                    aria-hidden="true"
                    className="size-4 text-primary"
                  />
                </div>

                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {value}
                </p>
              </article>
            ))}

            <article className="flex min-h-24 flex-col justify-between rounded-surface border border-border-default bg-surface px-4 py-3.5 sm:col-span-2 lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Gauge
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />

                    Alocação sobre efetivo base
                  </p>

                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {activeAssignments} de{" "}
                    {totalRequiredHeadcount}
                  </p>
                </div>

                <span className="text-sm font-medium tabular-nums text-primary">
                  {rawOccupancyPercent}%
                </span>
              </div>

              <div
                aria-label="Alocação sobre efetivo base"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progressValue}
                aria-valuetext={`${activeAssignments} de ${totalRequiredHeadcount}, ${rawOccupancyPercent}%`}
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${progressValue}%`,
                  }}
                />
              </div>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="operations-heading"
          className="mt-8"
        >
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                className="font-semibold"
                id="operations-heading"
              >
                Operações
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Resumo das operações ativas no contexto atual.
              </p>
            </div>

            <Link
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/app/operations"
            >
              Ver operações

              <ArrowRight
                aria-hidden="true"
                className="size-3.5"
              />
            </Link>
          </header>

          {overview.operations.length === 0 ? (
            <section className="mt-4 border-y border-dashed border-border-strong px-4 py-8 text-center">
              <h3 className="font-medium">
                Nenhuma operação ativa
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                Cadastre ou ative uma operação para acompanhar
                sua estrutura operacional aqui.
              </p>
            </section>
          ) : (
            <TableFrame className="mt-4">
              <TableScrollArea label="Resumo das operações">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operação</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Postos</TableHead>
                      <TableHead>
                        Colaboradores alocados
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {overview.operations.map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell className="font-medium">
                          <Link
                            className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                            href={`/app/operations/${operation.id}`}
                          >
                            {operation.name}
                          </Link>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {operation.clientName}
                        </TableCell>

                        <TableCell className="tabular-nums">
                          {operation.units}
                        </TableCell>

                        <TableCell className="tabular-nums">
                          {operation.positions}
                        </TableCell>

                        <TableCell className="tabular-nums">
                          {operation.allocatedWorkers}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollArea>
            </TableFrame>
          )}
        </section>
      </ContentContainer>
    </PageShell>
  );
}
