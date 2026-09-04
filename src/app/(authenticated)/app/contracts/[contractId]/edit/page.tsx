import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { listClients } from "@/modules/clients";
import {
  ContractForm,
  contractIdSchema,
  getContractById,
} from "@/modules/contracts";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default async function EditContractPage({
  params,
}: PageProps<"/app/contracts/[contractId]/edit">) {
  const route = contractIdSchema.safeParse((await params).contractId);

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
            breadcrumb={
              <Breadcrumb items={[{ label: "Comercial" }, { label: "Contratos" }]} />
            }
            description="Atualize o vínculo comercial, o período e a referência deste contrato."
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
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Comercial" },
                {
                  label: "Clientes",
                  href: "/app/clients",
                },
                {
                  label: contract.client.trade_name,
                  href: `/app/clients/${contract.client.id}`,
                },
                {
                  label: contract.name,
                  href: detailHref,
                },
                {
                  label: "Editar",
                },
              ]}
            />
          }
          description="Atualize o vínculo comercial, o período e a referência deste contrato."
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
