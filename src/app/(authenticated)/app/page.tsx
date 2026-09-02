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

import { getOperationalOverview } from "@/modules/overview/operational-overview";
import { toPublicErrorMessage } from "@/shared/errors";

const KPI_ITEMS = [
  { key: "activeOperations", label: "Operações ativas", icon: BriefcaseBusiness },
  { key: "activeUnits", label: "Unidades ativas", icon: Building2 },
  { key: "activeWorkers", label: "Colaboradores ativos", icon: Users },
  { key: "activeAssignments", label: "Alocações ativas", icon: Link2 },
] as const;

export default async function InternalHomePage() {
  let overview;
  try {
    overview = await getOperationalOverview();
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Visão geral</h1>
        <p className="mt-5 text-sm text-destructive">{toPublicErrorMessage(error)}</p>
      </main>
    );
  }

  const { activeAssignments, totalRequiredHeadcount } = overview.kpis;
  const rawOccupancyPercent = totalRequiredHeadcount > 0
    ? Math.round((activeAssignments / totalRequiredHeadcount) * 100)
    : 0;
  const progressValue = Math.min(rawOccupancyPercent, 100);
  const hasAttention =
    overview.attention.activeWorkersWithoutAssignment > 0 ||
    overview.attention.underfilledPositions > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Resumo da estrutura operacional atual.
        </p>
      </header>

      <section aria-label="Indicadores operacionais" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_ITEMS.map(({ key, label, icon: Icon }) => (
          <article key={key} className="flex min-h-24 flex-col justify-between rounded-lg border bg-card px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <Icon className="size-4 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{overview.kpis[key]}</p>
          </article>
        ))}

        <article className="flex min-h-24 flex-col justify-between rounded-lg border bg-card px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">Postos ativos</p>
            <MapPin className="size-4 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{overview.kpis.activePositions}</p>
        </article>
        <article className="flex min-h-24 flex-col justify-between rounded-lg border bg-card px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">Efetivo base</p>
            <UserRoundCheck className="size-4 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{totalRequiredHeadcount}</p>
        </article>
        <article className="flex min-h-24 flex-col justify-between rounded-lg border bg-card px-4 py-3.5 sm:col-span-2 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Gauge className="size-4 text-primary" aria-hidden="true" />
                Ocupação atual
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {activeAssignments} de {totalRequiredHeadcount}
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums text-primary">{rawOccupancyPercent}%</span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Ocupação atual"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressValue}
            aria-valuetext={`${activeAssignments} de ${totalRequiredHeadcount}, ${rawOccupancyPercent}%`}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${progressValue}%` }} />
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-lg border bg-card" aria-labelledby="attention-heading">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <AlertTriangle className={`size-4 ${hasAttention ? "text-warning" : "text-muted-foreground"}`} aria-hidden="true" />
          <h2 id="attention-heading" className="font-semibold">Requer atenção</h2>
        </div>
        {hasAttention ? (
          <div className="divide-y px-4">
            {overview.attention.underfilledPositions > 0 ? (
              <Link href="/app/positions" className="group -mx-2 flex flex-col gap-1.5 rounded-md px-2 py-3 text-sm font-medium transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="flex items-center gap-2.5"><MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{overview.attention.underfilledPositions} postos abaixo do efetivo base</span>
                <span className="flex shrink-0 items-center gap-1 pl-6.5 text-xs text-muted-foreground group-hover:text-foreground sm:pl-0">Ver postos <ArrowRight className="size-3.5" aria-hidden="true" /></span>
              </Link>
            ) : null}
            {overview.attention.activeWorkersWithoutAssignment > 0 ? (
              <Link href="/app/workers" className="group -mx-2 flex flex-col gap-1.5 rounded-md px-2 py-3 text-sm font-medium transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="flex items-center gap-2.5"><Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{overview.attention.activeWorkersWithoutAssignment} colaboradores ativos sem alocação ativa</span>
                <span className="flex shrink-0 items-center gap-1 pl-6.5 text-xs text-muted-foreground group-hover:text-foreground sm:pl-0">Ver colaboradores <ArrowRight className="size-3.5" aria-hidden="true" /></span>
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground"><CheckCircle2 className="size-4 text-success" aria-hidden="true" />Nenhuma pendência operacional identificada.</p>
        )}
      </section>

      <section className="mt-7" aria-labelledby="operations-heading">
        <div className="flex items-start justify-between gap-4 sm:items-end">
          <div>
            <h2 id="operations-heading" className="font-semibold">Operações</h2>
            <p className="mt-1 text-sm text-muted-foreground">Resumo das operações ativas.</p>
          </div>
          <Link href="/app/operations" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver operações <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
        </div>
        {overview.operations.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed bg-card px-4 py-4 text-sm text-muted-foreground">Nenhuma operação ativa. Cadastre uma operação para acompanhar sua estrutura aqui.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-4 py-2.5 font-medium">Operação</th><th className="px-4 py-2.5 font-medium">Cliente</th><th className="px-4 py-2.5 font-medium">Unidades</th><th className="px-4 py-2.5 font-medium">Postos</th><th className="px-4 py-2.5 font-medium">Colaboradores alocados</th></tr>
                </thead>
                <tbody className="divide-y">
                  {overview.operations.map((operation) => (
                    <tr key={operation.id} className="hover:bg-muted/35">
                      <td className="px-4 py-3 font-medium"><Link className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/app/operations/${operation.id}`}>{operation.name}</Link></td>
                      <td className="px-4 py-3 text-muted-foreground">{operation.clientName}</td>
                      <td className="px-4 py-3 tabular-nums">{operation.units}</td>
                      <td className="px-4 py-3 tabular-nums">{operation.positions}</td>
                      <td className="px-4 py-3 tabular-nums">{operation.allocatedWorkers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
