import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { WorkerForm } from "@/modules/workers";

export default function NewWorkerPage() {
  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Pessoas" }, { label: "Colaboradores", href: "/app/workers" }, { label: "Novo colaborador" }]} />}
          title="Novo colaborador"
          description="Cadastre os dados operacionais mínimos da pessoa."
        />
        <section className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8">
          <WorkerForm />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
