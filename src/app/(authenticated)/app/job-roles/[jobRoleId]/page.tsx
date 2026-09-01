import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import {
  getJobRoleById,
  JobRoleStatusAction,
  JobRoleStatusBadge,
  jobRoleIdSchema,
} from "@/modules/job-roles";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function JobRoleDetailsPage({ params }: PageProps<"/app/job-roles/[jobRoleId]">) {
  const route = jobRoleIdSchema.safeParse((await params).jobRoleId);
  if (!route.success) notFound();
  let jobRole;
  try { jobRole = await getJobRoleById(route.data); } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return <main className="mx-auto max-w-4xl px-4 py-10"><p className="text-sm text-destructive">{toPublicErrorMessage(error)}</p></main>;
  }
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><Button asChild variant="outline" size="sm"><Link href="/app/job-roles"><ArrowLeft className="size-4" />Voltar para cargos</Link></Button><div className="mt-6 flex items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold">{jobRole.name}</h1><JobRoleStatusBadge status={jobRole.status} /></div><p className="mt-2 text-sm text-muted-foreground">Cargo organizacional reutilizável</p></div><PermissionGate permission="job_role:update"><Button asChild variant="outline"><Link href={`/app/job-roles/${jobRole.id}/edit`}><Pencil className="size-4" />Editar</Link></Button></PermissionGate></div><section className="mt-8 rounded-lg border bg-card p-6"><dl><dt className="text-xs uppercase text-muted-foreground">Descrição</dt><dd className="mt-2 text-sm">{jobRole.description ?? "Não informada"}</dd></dl><div className="mt-6"><PermissionGate permission="job_role:update"><JobRoleStatusAction jobRoleId={jobRole.id} currentStatus={jobRole.status} /></PermissionGate></div></section></main>;
}
