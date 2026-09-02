import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import { getOperationOperationalDetail, operationIdSchema, OperationStatusAction, OperationStatusBadge } from "@/modules/operations";
import { UnitStatusBadge } from "@/modules/units";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "Não informada";
}

export default async function OperationDetailsPage({ params }: PageProps<"/app/operations/[operationId]">) {
  const route = operationIdSchema.safeParse((await params).operationId);
  if (!route.success) notFound();
  let operation;
  try { operation = await getOperationOperationalDetail(route.data); } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><p className="text-sm text-destructive">{toPublicErrorMessage(error)}</p></main>;
  }
  return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
    <Button asChild variant="outline" size="sm"><Link href="/app/operations"><ArrowLeft className="size-4" />Voltar para operações</Link></Button>
    <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">{operation.name}</h1><OperationStatusBadge status={operation.status} /></div><p className="mt-2 text-sm text-muted-foreground">Cliente: <Link className="font-medium text-foreground hover:underline" href={`/app/clients/${operation.contract.client.id}`}>{operation.contract.client.trade_name}</Link> · Contrato: <Link className="font-medium text-foreground hover:underline" href={`/app/contracts/${operation.contract.id}`}>{operation.contract.name}</Link></p></div><PermissionGate permission="operation:update"><Button asChild variant="outline"><Link href={`/app/operations/${operation.id}/edit`}><Pencil className="size-4" />Editar</Link></Button></PermissionGate></div>
    <dl className="mt-8 grid divide-y rounded-lg border bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0"><Metric label="Unidades ativas" value={operation.summary.activeUnits} /><Metric label="Postos ativos" value={operation.summary.activePositions} /><Metric label="Efetivo base" value={operation.summary.baseRequiredHeadcount} /><Metric label="Alocações ativas" value={operation.summary.activeAssignments} /></dl>
    <section className="mt-6 rounded-lg border bg-card"><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold">Unidades</h2><p className="mt-1 text-sm text-muted-foreground">Contexto e efetivo por unidade operacional.</p></div>{operation.status !== "closed" ? <PermissionGate permission="unit:create"><Button asChild size="sm"><Link href={`/app/units/new?operationId=${operation.id}`}><Plus className="size-4" />Nova unidade</Link></Button></PermissionGate> : null}</div>{operation.units.length === 0 ? <p className="px-5 py-6 text-sm text-muted-foreground">Esta operação ainda não possui unidades cadastradas.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Unidade</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Postos</th><th className="px-5 py-3">Efetivo base</th><th className="px-5 py-3">Ocupação</th></tr></thead><tbody className="divide-y">{operation.units.map((unit) => <tr key={unit.id}><td className="px-5 py-4"><Link className="font-medium hover:underline" href={`/app/units/${unit.id}`}>{unit.name}</Link><p className="mt-1 text-muted-foreground">{[unit.city, unit.state].filter(Boolean).join(" / ") || unit.code || "Localização não informada"}</p></td><td className="px-5 py-4"><UnitStatusBadge status={unit.status} /></td><td className="px-5 py-4 tabular-nums">{unit.activePositions}</td><td className="px-5 py-4 tabular-nums">{unit.baseRequiredHeadcount}</td><td className="px-5 py-4 tabular-nums"><span className="font-medium text-foreground">{unit.activeAssignments}</span> de {unit.baseRequiredHeadcount}</td></tr>)}</tbody></table></div>}</section>
    <section className="mt-6 rounded-lg border bg-card p-4"><dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2"><Detail label="Período" value={`${formatDate(operation.start_date)} — ${formatDate(operation.end_date)}`} /><Detail label="Gestor responsável" value={operation.manager?.display_name ?? "Não definido"} /><Detail label="Descrição" value={operation.description ?? "Não informada"} /></dl><PermissionGate permission="operation:update"><div className="mt-4 border-t pt-4"><OperationStatusAction operationId={operation.id} currentStatus={operation.status} /></div></PermissionGate></section>
  </main>;
}
function Metric({ label, value }: { label: string; value: number }) { return <div className="p-4"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>; }
