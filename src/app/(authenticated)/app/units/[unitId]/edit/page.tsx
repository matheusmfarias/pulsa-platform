import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { listOperations } from "@/modules/operations";
import { getUnitById, UnitForm, unitIdSchema } from "@/modules/units";

export default async function EditUnitPage({
  params,
  searchParams,
}: PageProps<"/app/units/[unitId]/edit">) {
  const route = unitIdSchema.safeParse((await params).unitId);

  if (!route.success) notFound();

  const [unit, operations] = await Promise.all([
    getUnitById(route.data),
    listOperations(),
  ]);
  const requestedTab = (await searchParams).tab;
  const returnTab = typeof requestedTab === "string" && ["positions", "workers", "status"].includes(requestedTab) ? requestedTab : undefined;
  const detailHref = `/app/units/${unit.id}${returnTab ? `?tab=${returnTab}` : ""}`;

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Unidades", href: "/app/units" }, { label: unit.name, href: detailHref }, { label: "Editar" }]} />}
          description="Atualize o contexto, a localização e as configurações desta unidade."
          title="Editar unidade"
        />

        <section
          aria-label="Formulário de edição da unidade"
          className="mt-5 rounded-card bg-surface p-5 shadow-card sm:p-6"
        >
          <UnitForm
            cancelHref={detailHref}
            operations={operations}
            returnTab={returnTab}
            unit={unit}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
