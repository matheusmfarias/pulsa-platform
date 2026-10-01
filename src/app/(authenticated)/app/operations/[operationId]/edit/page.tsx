import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { listOrganizationMembers } from "@/modules/administration";
import { getAuthorizationContext } from "@/modules/authorization";
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
  searchParams,
}: PageProps<"/app/operations/[operationId]/edit">) {
  const route = operationIdSchema.safeParse((await params).operationId);

  if (!route.success) notFound();

  let operation;
  let contracts;
  let managers;

  try {
    const authorization = await getAuthorizationContext();
    [operation, contracts, managers] = await Promise.all([
      getOperationById(route.data),
      listContracts(),
      authorization.role === "DIRECTOR"
        ? listOrganizationMembers()
        : Promise.resolve(undefined),
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
            breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Operações", href: "/app/operations" }]} />}
            title="Editar operação"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const requestedTab = (await searchParams).tab;
  const returnTab = typeof requestedTab === "string" && ["units", "status"].includes(requestedTab) ? requestedTab : undefined;
  const detailHref = `/app/operations/${operation.id}${returnTab ? `?tab=${returnTab}` : ""}`;

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Operações", href: "/app/operations" }, { label: operation.name, href: detailHref }, { label: "Editar" }]} />}
          description="Atualize o contexto contratual, o período e as informações desta operação."
          title="Editar operação"
        />

        <section
          aria-label="Formulário de edição da operação"
          className="mt-5 rounded-card bg-surface p-5 shadow-card sm:p-6"
        >
          <OperationForm
            cancelHref={detailHref}
            contracts={contracts}
            managers={managers}
            operation={operation}
            returnTab={returnTab}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
