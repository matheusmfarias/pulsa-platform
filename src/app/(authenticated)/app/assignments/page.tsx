import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { ListPagination } from "@/components/layout/list-pagination";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  assignmentListFiltersSchema,
  AssignmentTableSkeleton,
  AssignmentFilterBar,
  AssignmentTable,
  listAssignmentsPage,
} from "@/modules/assignments";
import { hasActiveAssignmentFilters } from "@/modules/assignments/domain/assignment-list-filters";
import { PermissionGate } from "@/modules/authorization";
import { getOperationalContextSelection } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

function assignmentsPageHref(filters: { query: string; status?: string; pageSize: number }, page: number, pageSize = filters.pageSize): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== 10) params.set("size", String(pageSize));
  return `/app/assignments?${params.toString()}`;
}

export default async function AssignmentsPage({
  searchParams,
}: PageProps<"/app/assignments">) {
  const query = await searchParams;

  const filters = assignmentListFiltersSchema.parse({
    query: query.q,
    status: query.status,
    pageSize: query.size,
  });
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.min(10_000, parsedPage)) : 1;
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
          breadcrumb={
            <Breadcrumb
              items={[{ label: "Operação" }, { label: "Alocações" }]}
            />
          }
          title="Alocações"
        />

        <AssignmentFilterBar filters={filters} />

        <Suspense fallback={<AssignmentTableSkeleton />}>
          <AssignmentResults filters={filters} hasActiveFilters={hasActiveFilters} page={page} />
        </Suspense>
      </ContentContainer>
    </PageShell>
  );
}

async function AssignmentResults({
  filters,
  hasActiveFilters,
  page,
}: {
  filters: ReturnType<typeof assignmentListFiltersSchema.parse>;
  hasActiveFilters: boolean;
  page: number;
}) {
  let result;

  try {
    const context = await getOperationalContextSelection();
    result = await listAssignmentsPage(filters, context, page);
  } catch (error) {
    return (
      <FeedbackMessage className="mt-6" variant="danger">
        {toPublicErrorMessage(error)}
      </FeedbackMessage>
    );
  }

  const assignments = result.items;

  return (
    <div className="mt-5 sm:mt-6">
      {result.total > 0 ? (
        <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium tabular-nums text-foreground">
              {result.total}
            </span>{" "}
            {result.total === 1 ? "alocação encontrada" : "alocações encontradas"}
            {hasActiveFilters ? " com os filtros atuais" : ""}
          </p>
        </div>
      ) : hasActiveFilters ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Nenhuma alocação encontrada com os filtros atuais
        </p>
      ) : null}

      {assignments.length === 0 ? (
        <section className="mt-4 rounded-card bg-surface px-6 py-8 text-center shadow-card sm:py-10">
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
        <AssignmentTable
          assignments={assignments}
          footer={
            <ListPagination
              currentPage={result.page}
              getHref={(targetPage) => assignmentsPageHref(filters, targetPage)}
              getPageSizeHref={(targetSize) => assignmentsPageHref(filters, 1, targetSize)}
              label="alocações"
              pageCount={result.pageCount}
              pageSize={result.pageSize}
              total={result.total}
            />
          }
        />
      )}
    </div>
  );
}
