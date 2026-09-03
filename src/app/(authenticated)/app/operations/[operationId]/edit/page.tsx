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
import { listContracts } from "@/modules/contracts";
import {
  getOperationById,
  operationIdSchema,
  OperationForm,
} from "@/modules/operations";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function EditOperationPage({
  params,
}: PageProps<"/app/operations/[operationId]/edit">) {
  const route = operationIdSchema.safeParse((await params).operationId);

  if (!route.success) notFound();

  let operation;
  let contracts;

  try {
    [operation, contracts] = await Promise.all([
      getOperationById(route.data),
      listContracts(),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <PageShell>
        <ContentContainer size="form">
          <PageHeader
            description="Atualize os dados e o período desta operação."
            eyebrow="Operações"
            title="Editar operação"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const detailHref = `/app/operations/${operation.id}`;

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
          description="Atualize o contexto contratual, o período e as informações desta operação."
          eyebrow="Operações"
          metadata={
            <span>
              Operação:{" "}
              <span className="font-medium text-foreground">
                {operation.name}
              </span>
            </span>
          }
          title="Editar operação"
        />

        <section
          aria-label="Formulário de edição da operação"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <OperationForm
            cancelHref={detailHref}
            contracts={contracts}
            operation={operation}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}