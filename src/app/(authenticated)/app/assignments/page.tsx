import { Plus } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  assignmentListFiltersSchema,
  AssignmentFilterBar,
  AssignmentTable,
  hasActiveAssignmentFilters,
  listAssignments,
} from "@/modules/assignments";
import { PermissionGate } from "@/modules/authorization";
import { resolveOperationalContext } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function AssignmentsPage({
  searchParams,
}: PageProps<"/app/assignments">) {
  const query = await searchParams;

  const filters = assignmentListFiltersSchema.parse({
    status: query.status,
  });

  let assignments;

  try {
    const { context } = await resolveOperationalContext();
    assignments = await listAssignments(filters, context);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            description="Relações temporais entre colaboradores e postos."
            eyebrow="Operação"
            title="Alocações"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const hasActiveFilters = hasActiveAssignmentFilters(filters);

  return (
    <PageShell>
      <ContentContainer size="list">
        <PageHeader
          actions={
            <PermissionGate permission="assignment:create">
              <Button asChild>
                <Link href="/app/assignments/new">
                  <Plus aria-hidden="true" className="size-4" />
                  Nova alocação
                </Link>
              </Button>
            </PermissionGate>
          }
          description="Relações temporais entre colaboradores e postos."
          eyebrow="Operação"
          title="Alocações"
        />

        <AssignmentFilterBar filters={filters} />

        <div className="mt-5 sm:mt-6">
          {assignments.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {assignments.length}
              </span>{" "}
              {assignments.length === 1
                ? "alocação encontrada"
                : "alocações encontradas"}
              {hasActiveFilters ? " com os filtros atuais" : ""}
            </p>
          ) : hasActiveFilters ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma alocação encontrada com os filtros atuais
            </p>
          ) : null}

          {assignments.length === 0 ? (
            <section className="mt-4 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
              <h2 className="font-medium">
                {hasActiveFilters
                  ? "Nenhuma alocação corresponde ao filtro"
                  : "Nenhuma alocação cadastrada"}
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {hasActiveFilters
                  ? "Altere ou limpe o filtro para visualizar outras alocações."
                  : "As alocações representam o vínculo temporal entre um colaborador e um posto."}
              </p>
            </section>
          ) : (
            <AssignmentTable assignments={assignments} />
          )}
        </div>
      </ContentContainer>
    </PageShell>
  );
}