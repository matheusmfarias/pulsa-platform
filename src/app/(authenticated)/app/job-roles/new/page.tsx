import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JobRoleForm } from "@/modules/job-roles";

export default function NewJobRolePage() {
  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Operação" },
                { label: "Cargos", href: "/app/job-roles" },
                { label: "Novo cargo" },
              ]}
            />
          }
          description="Cadastre um cargo ou função reutilizável na organização."
          title="Novo cargo"
        />
        <section
          aria-label="Formulário de cadastro do cargo"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <JobRoleForm />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
