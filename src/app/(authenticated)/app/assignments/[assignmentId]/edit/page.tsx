import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  assignmentIdSchema,
  AssignmentForm,
  getAssignmentById,
} from "@/modules/assignments";
import { listPositions } from "@/modules/positions";
import { listWorkers } from "@/modules/workers";

export default async function EditAssignmentPage({
  params,
}: PageProps<"/app/assignments/[assignmentId]/edit">) {
  const route = assignmentIdSchema.safeParse((await params).assignmentId);

  if (!route.success) notFound();

  const [assignment, workers, positions] = await Promise.all([
    getAssignmentById(route.data),
    listWorkers(),
    listPositions(),
  ]);

  const detailHref = `/app/assignments/${assignment.id}`;

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Operação" },
                { label: "Alocações", href: "/app/assignments" },
                { label: assignment.worker.full_name, href: detailHref },
                { label: "Editar" },
              ]}
            />
          }
          description="Atualize o vínculo operacional e o período desta alocação."
          title="Editar alocação"
        />

        <section
          aria-label="Formulário de edição da alocação"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <AssignmentForm
            assignment={assignment}
            cancelHref={detailHref}
            positions={positions}
            workers={workers}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
