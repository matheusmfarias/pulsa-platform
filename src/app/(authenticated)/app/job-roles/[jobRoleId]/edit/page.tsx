import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  getJobRoleById,
  JobRoleForm,
  jobRoleIdSchema,
} from "@/modules/job-roles";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function EditJobRolePage({
  params,
}: PageProps<"/app/job-roles/[jobRoleId]/edit">) {
  const route = jobRoleIdSchema.safeParse((await params).jobRoleId);
  if (!route.success) notFound();
  let jobRole;
  try {
    jobRole = await getJobRoleById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <PageShell>
        <ContentContainer size="form">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[{ label: "Operação" }, { label: "Cargos" }]}
              />
            }
            title="Editar cargo"
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
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Operação" },
                { label: "Cargos", href: "/app/job-roles" },
                { label: jobRole.name, href: `/app/job-roles/${jobRole.id}` },
                { label: "Editar" },
              ]}
            />
          }
          description="Atualize os dados do cargo reutilizável."
          title="Editar cargo"
        />
        <section
          aria-label="Formulário de edição do cargo"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <JobRoleForm jobRole={jobRole} />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
