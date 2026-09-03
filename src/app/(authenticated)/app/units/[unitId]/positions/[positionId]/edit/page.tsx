import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { listJobRoles } from "@/modules/job-roles";
import {
  getPositionById,
  PositionForm,
  positionIdSchema,
} from "@/modules/positions";
import { unitIdSchema } from "@/modules/units";

export default async function EditPositionPage({
  params,
}: PageProps<"/app/units/[unitId]/positions/[positionId]/edit">) {
  const values = await params;

  const route = unitIdSchema.safeParse(values.unitId);
  const id = positionIdSchema.safeParse(values.positionId);

  if (!route.success || !id.success) notFound();

  const [position, allJobRoles] = await Promise.all([
    getPositionById(id.data),
    listJobRoles(),
  ]);

  if (position.unit_id !== route.data) notFound();

  const jobRoles = allJobRoles.filter(
    (jobRole) =>
      jobRole.status === "active" || jobRole.id === position.job_role_id,
  );

  const detailHref = `/app/units/${route.data}/positions/${position.id}`;

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
          description="Atualize a estrutura e as informações cadastrais deste posto."
          eyebrow="Postos"
          title="Editar posto"
        />

        <section
          aria-label="Formulário de edição do posto"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <PositionForm
            cancelHref={detailHref}
            jobRoles={jobRoles}
            position={position}
            unitId={route.data}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}