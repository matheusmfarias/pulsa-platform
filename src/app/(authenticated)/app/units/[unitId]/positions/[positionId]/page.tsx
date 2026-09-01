import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AssignmentStatusBadge, listAssignments } from "@/modules/assignments";
import { PermissionGate } from "@/modules/authorization";
import { getPositionById, positionIdSchema, PositionStatusAction, PositionStatusBadge } from "@/modules/positions";
import { unitIdSchema } from "@/modules/units";

export default async function PositionDetailsPage({ params }: PageProps<"/app/units/[unitId]/positions/[positionId]">) {
  const values = await params;
  const unitId = unitIdSchema.safeParse(values.unitId);
  const positionId = positionIdSchema.safeParse(values.positionId);
  if (!unitId.success || !positionId.success) notFound();
  const [position, assignments] = await Promise.all([
    getPositionById(positionId.data),
    listAssignments({ positionId: positionId.data }),
  ]);
  if (position.unit.id !== unitId.data) notFound();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm"><Link href={`/app/units/${unitId.data}`}><ArrowLeft className="size-4" />Voltar para unidade</Link></Button>
      <div className="mt-6 flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold">{position.job_role.name}</h1><PositionStatusBadge status={position.status} /></div><p className="mt-2 text-sm text-muted-foreground">{position.unit.name}</p></div>
        <PermissionGate permission="position:update"><Button asChild variant="outline"><Link href={`/app/units/${unitId.data}/positions/${position.id}/edit`}><Pencil className="size-4" />Editar</Link></Button></PermissionGate>
      </div>
      <section className="mt-8 rounded-lg border bg-card p-6"><dl className="grid gap-6 sm:grid-cols-2"><div><dt className="text-xs uppercase text-muted-foreground">Efetivo base</dt><dd className="mt-2 text-sm">{position.base_required_headcount}</dd></div><div><dt className="text-xs uppercase text-muted-foreground">Descrição</dt><dd className="mt-2 text-sm">{position.description ?? "Não informada"}</dd></div></dl><div className="mt-6"><PermissionGate permission="position:update"><PositionStatusAction positionId={position.id} currentStatus={position.status} /></PermissionGate></div></section>
      <section className="mt-6 rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-4"><div><h2 className="font-semibold">Alocações</h2><p className="mt-1 text-sm text-muted-foreground">Histórico de colaboradores neste posto.</p></div>{position.status === "active" ? <PermissionGate permission="assignment:create"><Button asChild size="sm"><Link href={`/app/assignments/new?positionId=${position.id}`}><Plus className="size-4" />Nova alocação</Link></Button></PermissionGate> : null}</div>
        {assignments.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Nenhuma alocação relacionada.</p> : <ul className="divide-y">{assignments.map((assignment) => <li key={assignment.id} className="flex items-center justify-between px-6 py-4"><div><Link className="font-medium hover:underline" href={`/app/assignments/${assignment.id}`}>{assignment.worker.full_name}</Link><p className="mt-1 text-sm text-muted-foreground">{assignment.start_date} — {assignment.end_date ?? "em aberto"}</p></div><AssignmentStatusBadge status={assignment.status} /></li>)}</ul>}
      </section>
    </main>
  );
}
