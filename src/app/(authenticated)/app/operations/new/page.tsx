import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { contractIdSchema, listContracts } from "@/modules/contracts";
import { OperationForm } from "@/modules/operations";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{ contractId?: string }>;

export default async function NewOperationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const requestedContract = contractIdSchema.safeParse(
    (await searchParams).contractId,
  );

  let contracts;

  try {
    contracts = await listContracts({ status: "active" });
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="form">
          <PageHeader
            description="Registre um engajamento operacional para um contrato ativo."
            eyebrow="Operações"
            title="Nova operação"
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
        <Button asChild size="sm" variant="ghost">
          <Link href="/app/operations">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>

        <PageHeader
          className="mt-5 sm:mt-6"
          description="Registre um engajamento operacional para um contrato ativo."
          eyebrow="Operações"
          title="Nova operação"
        />

        {contracts.length === 0 ? (
          <section className="mt-8 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
            <h2 className="font-medium">
              Nenhum contrato ativo disponível
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              É necessário ter ao menos um contrato ativo para criar uma operação.
            </p>

            <Button asChild className="mt-5" variant="outline">
              <Link href="/app/contracts">Ver contratos</Link>
            </Button>
          </section>
        ) : (
          <section
            aria-label="Formulário de cadastro da operação"
            className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
          >
            <OperationForm
              cancelHref="/app/operations"
              contracts={contracts}
              defaultContractId={
                requestedContract.success
                  ? requestedContract.data
                  : undefined
              }
            />
          </section>
        )}
      </ContentContainer>
    </PageShell>
  );
}