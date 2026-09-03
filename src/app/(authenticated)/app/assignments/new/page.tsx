import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
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
      ? `/app/units/${selectedPosition.unit.id}/positions/${selectedPosition.id}`
      : "/app/assignments";

  return (
    <PageShell>
      <ContentContainer size="form">
        <Button asChild size="sm" variant="ghost">
          <Link href={cancelHref}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>

        <PageHeader
          className="mt-5 sm:mt-6"
          description="Vincule um colaborador ativo a um posto ativo por um período definido."
          eyebrow="Alocações"
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
