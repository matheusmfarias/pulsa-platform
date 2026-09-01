import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getJobRoleById, JobRoleForm, jobRoleIdSchema } from "@/modules/job-roles";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function EditJobRolePage({ params }: PageProps<"/app/job-roles/[jobRoleId]/edit">) {
  const route = jobRoleIdSchema.safeParse((await params).jobRoleId);
  if (!route.success) notFound();
  let jobRole;
  try { jobRole = await getJobRoleById(route.data); } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return <main className="mx-auto max-w-3xl px-4 py-10"><p className="text-sm text-destructive">{toPublicErrorMessage(error)}</p></main>;
  }
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"><Button asChild variant="outline" size="sm"><Link href={`/app/job-roles/${jobRole.id}`}><ArrowLeft className="size-4" />Voltar</Link></Button><div className="mt-6"><h1 className="text-2xl font-semibold">Editar cargo</h1><p className="mt-2 text-sm text-muted-foreground">{jobRole.name}</p></div><section className="mt-8 rounded-lg border bg-card p-6 sm:p-8"><JobRoleForm jobRole={jobRole} /></section></main>;
}
