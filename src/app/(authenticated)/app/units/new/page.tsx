import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { listOperations } from "@/modules/operations";
import { UnitForm } from "@/modules/units";

export default async function NewUnitPage({
  searchParams,
}: PageProps<"/app/units/new">) {
  const operationId = (await searchParams).operationId;
  const operations = await listOperations();

  return (
    <PageShell>
      <ContentContainer size="form">
        <Button asChild size="sm" variant="ghost">
          <Link href="/app/units">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>

        <PageHeader
          className="mt-5 sm:mt-6"
          description="Cadastre um local vinculado à estrutura operacional."
          eyebrow="Unidades"
          title="Nova unidade"
        />

        <section
          aria-label="Formulário de cadastro da unidade"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <UnitForm
            cancelHref="/app/units"
            defaultOperationId={
              typeof operationId === "string" ? operationId : undefined
            }
            operations={operations}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}