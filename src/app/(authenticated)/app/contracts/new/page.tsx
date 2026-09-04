import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { clientIdSchema, listClients } from "@/modules/clients";
import { ContractForm } from "@/modules/contracts";
import { toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

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
            breadcrumb={
              <Breadcrumb
                items={[
                  { label: "Comercial" },
                  {
                    label: "Contratos",
                    href: "/app/contracts",
                  },
                  { label: "Novo contrato" },
                ]}
              />
            }
            description="Registre o vínculo comercial de um cliente ativo."
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

  const defaultClient = defaultClientId
    ? (clients.find((client) => client.id === defaultClientId) ?? null)
    : null;

  const cancelHref = defaultClientId
    ? `/app/clients/${defaultClientId}`
    : "/app/contracts";

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={
                defaultClient
                  ? [
                      { label: "Comercial" },
                      {
                        label: "Clientes",
                        href: "/app/clients",
                      },
                      {
                        label: defaultClient.trade_name,
                        href: `/app/clients/${defaultClient.id}`,
                      },
                      { label: "Novo contrato" },
                    ]
                  : [
                      { label: "Comercial" },
                      {
                        label: "Contratos",
                        href: "/app/contracts",
                      },
                      { label: "Novo contrato" },
                    ]
              }
            />
          }
          description="Registre o vínculo comercial de um cliente ativo."
          title="Novo contrato"
        />

        {clients.length === 0 ? (
          <section className="mt-8 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
            <h2 className="font-medium">Nenhum cliente ativo disponível</h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              É necessário ter ao menos um cliente ativo para criar um contrato.
            </p>

            <Button asChild className="mt-5" variant="outline">
              <Link href="/app/clients">Ver clientes</Link>
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
