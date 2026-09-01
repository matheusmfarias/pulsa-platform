import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  getWorkerById,
  WorkerForm,
  workerIdSchema,
} from "@/modules/workers";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function EditWorkerPage({
  params,
}: PageProps<"/app/workers/[workerId]/edit">) {
  const route = workerIdSchema.safeParse((await params).workerId);
  if (!route.success) notFound();
  let worker;
  try {
    worker = await getWorkerById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-destructive">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/workers/${worker.id}`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
      </Button>
      <h1 className="mt-6 text-2xl font-semibold">Editar colaborador</h1>
      <p className="mt-2 text-sm text-muted-foreground">{worker.full_name}</p>
      <section className="mt-8 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <WorkerForm worker={worker} />
      </section>
    </main>
  );
}
