import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
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
        <Button asChild size="sm" variant="ghost">
          <Link href={`/app/units/${unit.id}`}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>

        <PageHeader
          className="mt-5 sm:mt-6"
          description="Atualize o contexto, a localização e as configurações desta unidade."
          eyebrow="Unidades"
          metadata={
            <span>
              Unidade:{" "}
              <span className="font-medium text-foreground">{unit.name}</span>
            </span>
          }
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
