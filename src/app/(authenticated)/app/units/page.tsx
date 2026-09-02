import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import { listUnitOperationalSummaries, UnitStatusBadge } from "@/modules/units";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function UnitsPage() {
  let units;
  try { units = await listUnitOperationalSummaries(); } catch (error) {
    return <main className="mx-auto max-w-7xl px-4 py-10"><h1 className="text-2xl font-semibold">Unidades</h1><p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive">{toPublicErrorMessage(error)}</p></main>;
  }
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="flex items-end justify-between"><div><p className="text-sm font-medium text-primary">Estrutura operacional</p><h1 className="mt-1 text-2xl font-semibold">Unidades</h1><p className="mt-2 text-sm text-muted-foreground">Locais vinculados às operações.</p></div><PermissionGate permission="unit:create"><Button asChild><Link href="/app/units/new"><Plus className="size-4" />Nova unidade</Link></Button></PermissionGate></div>
    {units.length === 0 ? <section className="mt-6 rounded-lg border border-dashed bg-card px-6 py-10 text-center">Nenhuma unidade encontrada.</section> : <div className="mt-6 overflow-hidden rounded-lg border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Nome</th><th className="px-5 py-3">Código</th><th className="px-5 py-3">Operação</th><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Postos</th><th className="px-5 py-3">Ocupação</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y">{units.map((unit) => <tr key={unit.id} className="hover:bg-hover"><td className="px-5 py-4 font-medium"><Link href={`/app/units/${unit.id}`} className="hover:underline">{unit.name}</Link></td><td className="px-5 py-4 text-muted-foreground">{unit.code ?? "—"}</td><td className="px-5 py-4"><Link href={`/app/operations/${unit.operation.id}`} className="hover:underline">{unit.operation.name}</Link></td><td className="px-5 py-4 text-muted-foreground">{unit.operation.contract.client.trade_name}</td><td className="px-5 py-4 tabular-nums">{unit.activePositions}</td><td className="px-5 py-4 tabular-nums"><span className="font-medium text-foreground">{unit.activeAssignments}</span> de {unit.baseRequiredHeadcount}</td><td className="px-5 py-4"><UnitStatusBadge status={unit.status} /></td></tr>)}</tbody></table></div></div>}
  </main>;
}
