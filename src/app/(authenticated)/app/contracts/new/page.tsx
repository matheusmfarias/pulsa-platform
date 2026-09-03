import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  clientIdSchema,
  listClients,
} from "@/modules/clients";
import { ContractForm } from "@/modules/contracts";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{ clientId?: string }>;

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const requestedClient = clientIdSchema.safeParse(
    (await searchParams).clientId,
  );

  let clients;

  try {
    clients = await listClients({
      query: "",
      status: "active",
    });
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="form">
          <PageHeader
            description="Registre o vínculo comercial de um cliente ativo."
            eyebrow="Contratos"
            title="Novo contrato"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const defaultClientId = requestedClient.success
    ? requestedClient.data
    : undefined;

  const cancelHref = defaultClientId
    ? `/app/clients/${defaultClientId}`
    : "/app/contracts";

  return (
    <PageShell>
      <ContentContainer size="form">
        <Button asChild size="sm" variant="ghost">
          <Link href={cancelHref}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>

        <PageHeader
          className="mt-5 sm:mt-6"
          description="Registre o vínculo comercial de um cliente ativo."
          eyebrow="Contratos"
          title="Novo contrato"
        />

        {clients.length === 0 ? (
          <section className="mt-8 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
            <h2 className="font-medium">
              Nenhum cliente ativo disponível
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              É necessário ter ao menos um cliente ativo para criar um contrato.
            </p>

            <Button asChild className="mt-5" variant="outline">
              <Link href="/app/clients">
                Ver clientes
              </Link>
            </Button>
          </section>
        ) : (
          <section
            aria-label="Formulário de cadastro do contrato"
            className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
          >
            <ContractForm
              cancelHref={cancelHref}
              clients={clients}
              defaultClientId={defaultClientId}
            />
          </section>
        )}
      </ContentContainer>
    </PageShell>
  );
}