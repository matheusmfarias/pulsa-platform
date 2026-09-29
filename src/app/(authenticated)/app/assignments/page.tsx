import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
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
  listAssignmentsPage,
} from "@/modules/assignments";
import { PermissionGate } from "@/modules/authorization";
import { getOperationalContextSelection } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

function assignmentsPageHref(status: string | undefined, page: number): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  return `/app/assignments?${params.toString()}`;
}

export default async function AssignmentsPage({
  searchParams,
}: PageProps<"/app/assignments">) {
  const query = await searchParams;

  const filters = assignmentListFiltersSchema.parse({
    status: query.status,
  });
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.min(10_000, parsedPage)) : 1;

  let result;

  try {
    const context = await getOperationalContextSelection();
    result = await listAssignmentsPage(filters, context, page);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[{ label: "Operação" }, { label: "Alocações" }]}
              />
            }
            description="Relações temporais entre colaboradores e postos."
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
  const assignments = result.items;

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
          breadcrumb={
            <Breadcrumb
              items={[{ label: "Operação" }, { label: "Alocações" }]}
            />
          }
          title="Alocações"
        />

        <AssignmentFilterBar filters={filters} />

        <div className="mt-5 sm:mt-6">
          {result.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <p>
              <span className="font-medium tabular-nums text-foreground">
                {result.total}
              </span>{" "}
              {result.total === 1
                ? "alocação encontrada"
                : "alocações encontradas"}
              {hasActiveFilters ? " com os filtros atuais" : ""}
              </p>
              <p>Página {result.page} de {result.pageCount}</p>
            </div>
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
          {result.total > 0 ? (
            <nav aria-label="Paginação das alocações" className="mt-5 flex items-center justify-between gap-3">
              {result.page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={assignmentsPageHref(filters.status, result.page - 1)} scroll={false}>
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Anterior
                  </Link>
                </Button>
              ) : <Button disabled variant="outline"><ArrowLeft aria-hidden="true" className="size-4" />Anterior</Button>}
              {result.page < result.pageCount ? (
                <Button asChild variant="outline">
                  <Link href={assignmentsPageHref(filters.status, result.page + 1)} scroll={false}>
                    Próxima
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ) : <Button disabled variant="outline">Próxima<ArrowRight aria-hidden="true" className="size-4" /></Button>}
            </nav>
          ) : null}
        </div>
      </ContentContainer>
    </PageShell>
  );
}
