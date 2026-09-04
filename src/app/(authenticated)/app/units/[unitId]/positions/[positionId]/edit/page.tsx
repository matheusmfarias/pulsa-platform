import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { listJobRoles } from "@/modules/job-roles";
import {
  getPositionById,
  PositionForm,
  positionIdSchema,
} from "@/modules/positions";
import { unitIdSchema } from "@/modules/units";

export default async function EditPositionPage({
  params,
}: {
  params: Promise<{ positionId: string; unitId?: string }>;
}) {
  const values = await params;

  const route = values.unitId ? unitIdSchema.safeParse(values.unitId) : null;
  const id = positionIdSchema.safeParse(values.positionId);

  if ((route && !route.success) || !id.success) notFound();

  const [position, allJobRoles] = await Promise.all([
    getPositionById(id.data),
    listJobRoles(),
  ]);

  if (route?.success && position.unit_id !== route.data) notFound();

  const jobRoles = allJobRoles.filter(
    (jobRole) =>
      jobRole.status === "active" || jobRole.id === position.job_role_id,
  );

  const isGlobalRoute = !route;
  const detailHref = isGlobalRoute
    ? `/app/positions/${position.id}`
    : `/app/units/${position.unit_id}/positions/${position.id}`;
  const breadcrumbItems = isGlobalRoute
    ? [
        { label: "Operação" },
        { label: "Postos", href: "/app/positions" },
        { label: position.job_role.name, href: detailHref },
        { label: "Editar" },
      ]
    : [
        { label: "Operação" },
        { label: "Unidades", href: "/app/units" },
        { label: position.job_role.name, href: detailHref },
        { label: "Editar" },
      ];

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={<Breadcrumb items={breadcrumbItems} />}
          description="Atualize a estrutura e as informações cadastrais deste posto."
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
            redirectToPosition={isGlobalRoute}
            unitId={position.unit_id}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
