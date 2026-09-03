import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/modules/clients";

export default function NewClientPage() {
  return (
    <PageShell>
      <ContentContainer size="form">
        <Button asChild size="sm" variant="ghost">
          <Link href="/app/clients">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>

        <PageHeader
          className="mt-5 sm:mt-6"
          description="Cadastre os dados jurídicos e comerciais da empresa atendida."
          eyebrow="Clientes"
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