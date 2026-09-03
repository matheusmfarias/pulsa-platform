import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { listClients } from "@/modules/clients";
import {
  ContractForm,
  contractIdSchema,
  getContractById,
} from "@/modules/contracts";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function EditContractPage({
  params,
}: PageProps<"/app/contracts/[contractId]/edit">) {
  const route = contractIdSchema.safeParse(
    (await params).contractId,
  );

  if (!route.success) notFound();

  let contract;
  let clients;

  try {
    [contract, clients] = await Promise.all([
      getContractById(route.data),
      listClients({
        query: "",
        status: "all",
      }),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <PageShell>
        <ContentContainer size="form">
          <PageHeader
            description="Atualize o vínculo comercial, o período e a referência deste contrato."
            eyebrow="Contratos"
            title="Editar contrato"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const detailHref = `/app/contracts/${contract.id}`;

  return (
    <PageShell>
      <ContentContainer size="form">
        <Button asChild size="sm" variant="ghost">
          <Link href={detailHref}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>

        <PageHeader
          className="mt-5 sm:mt-6"
          description="Atualize o vínculo comercial, o período e a referência deste contrato."
          eyebrow="Contratos"
          metadata={
            <span>
              Contrato:{" "}
              <span className="font-medium text-foreground">
                {contract.name}
              </span>
            </span>
          }
          title="Editar contrato"
        />

        <section
          aria-label="Formulário de edição do contrato"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <ContractForm
            cancelHref={detailHref}
            clients={clients}
            contract={contract}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}