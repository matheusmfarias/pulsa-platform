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
import {
  ClientForm,
  clientIdSchema,
  getClientById,
} from "@/modules/clients";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

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
            description="Atualize os dados jurídicos e comerciais deste cliente."
            eyebrow="Clientes"
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
        <Button asChild size="sm" variant="ghost">
          <Link href={detailHref}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>

        <PageHeader
          className="mt-5 sm:mt-6"
          description="Atualize os dados jurídicos e comerciais deste cliente."
          eyebrow="Clientes"
          metadata={
            <span>
              Cliente:{" "}
              <span className="font-medium text-foreground">
                {client.trade_name}
              </span>
            </span>
          }
          title="Editar cliente"
        />

        <section
          aria-label="Formulário de edição do cliente"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <ClientForm
            cancelHref={detailHref}
            client={client}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}