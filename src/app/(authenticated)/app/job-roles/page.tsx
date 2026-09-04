import { Plus } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import {
  JobRoleFilterBar,
  JobRoleTable,
  jobRoleListFiltersSchema,
  hasActiveJobRoleFilters,
  listJobRoles,
} from "@/modules/job-roles";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function JobRolesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const parameters = await searchParams;
  const filters = jobRoleListFiltersSchema.parse({
    query: parameters.q,
    status: parameters.status,
  });
  let jobRoles;

  try {
    jobRoles = await listJobRoles(filters);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[{ label: "Operação" }, { label: "Cargos" }]}
              />
            }
            description="Catálogo organizacional reutilizável de cargos e funções."
            title="Cargos"
          />
          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const hasActiveFilters = hasActiveJobRoleFilters(filters);

  return (
    <PageShell>
      <ContentContainer size="list">
        <PageHeader
          actions={
            <PermissionGate permission="job_role:create">
              <Button asChild>
                <Link href="/app/job-roles/new">
                  <Plus aria-hidden="true" className="size-4" />
                  Novo cargo
                </Link>
              </Button>
            </PermissionGate>
          }
          breadcrumb={
            <Breadcrumb items={[{ label: "Operação" }, { label: "Cargos" }]} />
          }
          description="Catálogo organizacional reutilizável de cargos e funções."
          title="Cargos"
        />
        <JobRoleFilterBar filters={filters} />
        <div className="mt-5 sm:mt-6">
          {jobRoles.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {jobRoles.length}
              </span>{" "}
              {jobRoles.length === 1
                ? "cargo encontrado"
                : "cargos encontrados"}
              {hasActiveFilters ? " com os filtros atuais" : ""}
            </p>
          ) : hasActiveFilters ? (
            <p className="text-sm text-muted-foreground">
              Nenhum cargo encontrado com os filtros atuais
            </p>
          ) : null}

          {jobRoles.length === 0 ? (
            <section className="mt-4 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
              <h2 className="font-medium">
                {hasActiveFilters
                  ? "Nenhum cargo corresponde aos filtros"
                  : "Nenhum cargo cadastrado"}
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {hasActiveFilters
                  ? "Ajuste a busca, altere o status ou limpe os filtros para visualizar outros cargos."
                  : "Os cargos formam o catálogo organizacional reutilizado na estrutura operacional."}
              </p>
            </section>
          ) : (
            <JobRoleTable jobRoles={jobRoles} />
          )}
        </div>
      </ContentContainer>
    </PageShell>
  );
}
