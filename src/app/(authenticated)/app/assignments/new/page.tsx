import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AssignmentForm } from "@/modules/assignments";
import { listPositions } from "@/modules/positions";
import { listWorkers } from "@/modules/workers";

export default async function NewAssignmentPage({ searchParams }: PageProps<"/app/assignments/new">) {
  const query = await searchParams;
  const [workers, positions] = await Promise.all([
    listWorkers(),
    listPositions(),
  ]);
  const workerId = typeof query.workerId === "string" ? query.workerId : undefined;
  const positionId = typeof query.positionId === "string" ? query.positionId : undefined;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm"><Link href={workerId ? `/app/workers/${workerId}` : "/app/assignments"}><ArrowLeft className="size-4" />Voltar</Link></Button>
      <h1 className="mt-6 text-2xl font-semibold">Nova alocação</h1>
      <p className="mt-2 text-sm text-muted-foreground">Vincule um colaborador ativo a um posto ativo.</p>
      <section className="mt-8 rounded-lg border bg-card p-6">
        <AssignmentForm workers={workers} positions={positions} defaultWorkerId={workerId} defaultPositionId={positionId} />
      </section>
    </main>
  );
}
