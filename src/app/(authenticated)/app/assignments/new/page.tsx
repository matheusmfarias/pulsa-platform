import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AssignmentForm } from "@/modules/assignments";
import { listPositions } from "@/modules/positions";
import { listWorkers } from "@/modules/workers";

export default async function NewAssignmentPage({
  searchParams,
}: PageProps<"/app/assignments/new">) {
  const query = await searchParams;

  const [workers, positions] = await Promise.all([
    listWorkers(),
    listPositions(),
  ]);

  const workerId =
    typeof query.workerId === "string" ? query.workerId : undefined;

  const positionId =
    typeof query.positionId === "string" ? query.positionId : undefined;

  const selectedPosition = positionId
    ? positions.find((position) => position.id === positionId)
    : undefined;

  const cancelHref = workerId
    ? `/app/workers/${workerId}`
    : selectedPosition
      ? `/app/positions/${selectedPosition.id}`
      : "/app/assignments";

  const selectedPositionHref = selectedPosition
    ? `/app/positions/${selectedPosition.id}`
    : undefined;

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={
                selectedPosition && selectedPositionHref
                  ? [
                      { label: "Operação" },
                      { label: "Postos", href: "/app/positions" },
                      {
                        label: selectedPosition.job_role.name,
                        href: selectedPositionHref,
                      },
                      { label: "Nova alocação" },
                    ]
                  : [
                      { label: "Operação" },
                      { label: "Alocações", href: "/app/assignments" },
                      { label: "Nova alocação" },
                    ]
              }
            />
          }
          description="Vincule um colaborador ativo a um posto ativo por um período definido."
          title="Nova alocação"
        />

        <section
          aria-label="Formulário de cadastro da alocação"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <AssignmentForm
            cancelHref={cancelHref}
            defaultPositionId={positionId}
            defaultWorkerId={workerId}
            positions={positions}
            workers={workers}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
