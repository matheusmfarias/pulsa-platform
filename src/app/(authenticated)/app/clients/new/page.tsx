import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { ClientForm } from "@/modules/clients";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function NewClientPage() {
  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Comercial" },
                { label: "Clientes", href: "/app/clients" },
                { label: "Novo cliente" },
              ]}
            />
          }
          description="Cadastre os dados jurídicos e comerciais da empresa atendida."
          title="Novo cliente"
        />

        <section
          aria-label="Formulário de cadastro do cliente"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <ClientForm cancelHref="/app/clients" />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
