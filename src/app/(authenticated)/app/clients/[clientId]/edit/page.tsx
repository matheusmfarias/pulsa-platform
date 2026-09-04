import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { ClientForm, clientIdSchema, getClientById } from "@/modules/clients";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default async function EditClientPage({
  params,
}: PageProps<"/app/clients/[clientId]/edit">) {
  const route = clientIdSchema.safeParse((await params).clientId);

  if (!route.success) notFound();

  let client;

  try {
    client = await getClientById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <PageShell>
        <ContentContainer size="form">
          <PageHeader
            breadcrumb={
              <Breadcrumb items={[{ label: "Comercial" }, { label: "Clientes" }]} />
            }
            description="Atualize os dados jurídicos e comerciais deste cliente."
            title="Editar cliente"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const detailHref = `/app/clients/${client.id}`;

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Comercial" },
                { label: "Clientes", href: "/app/clients" },
                {
                  label: client.trade_name,
                  href: `/app/clients/${client.id}`,
                },
                { label: "Editar" },
              ]}
            />
          }
          description="Atualize os dados jurídicos e comerciais deste cliente."
          title="Editar cliente"
        />

        <section
          aria-label="Formulário de edição do cliente"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <ClientForm cancelHref={detailHref} client={client} />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
