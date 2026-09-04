import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import {
  getJobRoleById,
  JobRoleStatusAction,
  JobRoleStatusBadge,
  jobRoleIdSchema,
} from "@/modules/job-roles";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function JobRoleDetailsPage({
  params,
}: PageProps<"/app/job-roles/[jobRoleId]">) {
  const route = jobRoleIdSchema.safeParse((await params).jobRoleId);
  if (!route.success) notFound();
  let jobRole;
  try {
    jobRole = await getJobRoleById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <PageShell>
        <ContentContainer size="detail">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[{ label: "Operação" }, { label: "Cargos" }]}
              />
            }
            title="Detalhe do cargo"
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
      <ContentContainer size="detail">
        <PageHeader
          actions={
            <PermissionGate permission="job_role:update">
              <Button asChild variant="outline">
                <Link href={`/app/job-roles/${jobRole.id}/edit`}>
                  <Pencil aria-hidden="true" className="size-4" />
                  Editar
                </Link>
              </Button>
            </PermissionGate>
          }
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Operação" },
                { label: "Cargos", href: "/app/job-roles" },
                { label: jobRole.name },
              ]}
            />
          }
          description="Cargo organizacional reutilizável."
          metadata={<JobRoleStatusBadge status={jobRole.status} />}
          title={jobRole.name}
        />
        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <section className="py-6">
            <h2 className="font-semibold">Dados do cargo</h2>
            <dl className="mt-5">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Descrição
                </dt>
                <dd className="mt-1 text-sm leading-6">
                  {jobRole.description ?? "Não informada"}
                </dd>
              </div>
            </dl>
          </section>
          <PermissionGate permission="job_role:update">
            <section className="py-6">
              <h2 className="font-semibold">Situação do cargo</h2>
              <div className="mt-5">
                <JobRoleStatusAction
                  jobRoleId={jobRole.id}
                  currentStatus={jobRole.status}
                />
              </div>
            </section>
          </PermissionGate>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
