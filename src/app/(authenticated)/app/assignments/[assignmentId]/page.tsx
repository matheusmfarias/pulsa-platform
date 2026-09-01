import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  assignmentIdSchema,
  AssignmentStatusAction,
  AssignmentStatusBadge,
  getAssignmentById,
} from "@/modules/assignments";
import { PermissionGate } from "@/modules/authorization";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string | null) {
  if (!value) return "Sem término";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function AssignmentDetailsPage({ params }: PageProps<"/app/assignments/[assignmentId]">) {
  const route = assignmentIdSchema.safeParse((await params).assignmentId);
  if (!route.success) notFound();
  let assignment;
  try {
    assignment = await getAssignmentById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return <main className="mx-auto max-w-4xl px-4 py-10"><p className="text-sm text-destructive">{toPublicErrorMessage(error)}</p></main>;
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm"><Link href="/app/assignments"><ArrowLeft className="size-4" />Voltar para alocações</Link></Button>
      <div className="mt-6 flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold">{assignment.worker.full_name}</h1><AssignmentStatusBadge status={assignment.status} /></div><p className="mt-2 text-sm text-muted-foreground">{assignment.position.job_role.name} — {assignment.position.unit.name}</p></div>
        <PermissionGate permission="assignment:update"><Button asChild variant="outline"><Link href={`/app/assignments/${assignment.id}/edit`}><Pencil className="size-4" />Editar</Link></Button></PermissionGate>
      </div>
      <section className="mt-8 rounded-lg border bg-card p-6">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div><dt className="text-xs uppercase text-muted-foreground">Colaborador</dt><dd className="mt-2 text-sm"><Link className="font-medium hover:underline" href={`/app/workers/${assignment.worker.id}`}>{assignment.worker.full_name}</Link></dd></div>
          <div><dt className="text-xs uppercase text-muted-foreground">Posto</dt><dd className="mt-2 text-sm"><Link className="font-medium hover:underline" href={`/app/units/${assignment.position.unit.id}/positions/${assignment.position.id}`}>{assignment.position.job_role.name}</Link></dd></div>
          <div><dt className="text-xs uppercase text-muted-foreground">Data inicial</dt><dd className="mt-2 text-sm">{formatDate(assignment.start_date)}</dd></div>
          <div><dt className="text-xs uppercase text-muted-foreground">Data final</dt><dd className="mt-2 text-sm">{formatDate(assignment.end_date)}</dd></div>
        </dl>
      </section>
      <section className="mt-6 rounded-lg border bg-card p-6"><h2 className="font-semibold">Status da alocação</h2><div className="mt-4"><PermissionGate permission="assignment:update"><AssignmentStatusAction assignmentId={assignment.id} currentStatus={assignment.status} /></PermissionGate></div></section>
    </main>
  );
}
