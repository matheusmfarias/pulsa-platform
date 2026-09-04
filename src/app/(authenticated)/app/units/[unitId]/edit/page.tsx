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
}: PageProps<"/app/units/[unitId]/edit">) {
  const route = unitIdSchema.safeParse((await params).unitId);

  if (!route.success) notFound();

  const [unit, operations] = await Promise.all([
    getUnitById(route.data),
    listOperations(),
  ]);

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Unidades", href: "/app/units" }, { label: unit.name, href: `/app/units/${unit.id}` }, { label: "Editar" }]} />}
          description="Atualize o contexto, a localização e as configurações desta unidade."
          title="Editar unidade"
        />

        <section
          aria-label="Formulário de edição da unidade"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <UnitForm
            cancelHref={`/app/units/${unit.id}`}
            operations={operations}
            unit={unit}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
