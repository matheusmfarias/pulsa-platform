import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { assignmentIdSchema, AssignmentForm, getAssignmentById } from "@/modules/assignments";
import { listPositions } from "@/modules/positions";
import { listWorkers } from "@/modules/workers";

export default async function EditAssignmentPage({ params }: PageProps<"/app/assignments/[assignmentId]/edit">) {
  const route = assignmentIdSchema.safeParse((await params).assignmentId);
  if (!route.success) notFound();
  const [assignment, workers, positions] = await Promise.all([
    getAssignmentById(route.data),
    listWorkers(),
    listPositions(),
  ]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm"><Link href={`/app/assignments/${assignment.id}`}><ArrowLeft className="size-4" />Voltar</Link></Button>
      <h1 className="mt-6 text-2xl font-semibold">Editar alocação</h1>
      <section className="mt-8 rounded-lg border bg-card p-6"><AssignmentForm assignment={assignment} workers={workers} positions={positions} /></section>
    </main>
  );
}
