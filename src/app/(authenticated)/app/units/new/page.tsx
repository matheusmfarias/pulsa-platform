import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { listOperations } from "@/modules/operations";
import { UnitForm } from "@/modules/units";

export default async function NewUnitPage({
  searchParams,
}: PageProps<"/app/units/new">) {
  const operationId = (await searchParams).operationId;
  const operations = await listOperations();
  const selectedOperation =
    typeof operationId === "string"
      ? operations.find((operation) => operation.id === operationId)
      : undefined;

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={
                selectedOperation
                  ? [
                      { label: "Operação" },
                      { label: "Operações", href: "/app/operations" },
                      {
                        label: selectedOperation.name,
                        href: `/app/operations/${selectedOperation.id}`,
                      },
                      { label: "Nova unidade" },
                    ]
                  : [
                      { label: "Operação" },
                      { label: "Unidades", href: "/app/units" },
                      { label: "Nova unidade" },
                    ]
              }
            />
          }
          description="Cadastre um local vinculado à estrutura operacional."
          title="Nova unidade"
        />

        <section
          aria-label="Formulário de cadastro da unidade"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <UnitForm
            cancelHref="/app/units"
            defaultOperationId={
              typeof operationId === "string" ? operationId : undefined
            }
            operations={operations}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
