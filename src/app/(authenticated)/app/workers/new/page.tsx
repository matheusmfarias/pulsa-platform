import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { WorkerForm } from "@/modules/workers";

export default function NewWorkerPage() {
  return (
    <PageShell>
      <ContentContainer size="form">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/workers">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar
          </Link>
        </Button>
        <PageHeader
          className="mt-6"
          eyebrow="Colaboradores"
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
