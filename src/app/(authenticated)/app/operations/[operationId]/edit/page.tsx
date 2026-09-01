import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { listContracts } from "@/modules/contracts";
import {
  getOperationById,
  operationIdSchema,
  OperationForm,
} from "@/modules/operations";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function EditOperationPage({
  params,
}: PageProps<"/app/operations/[operationId]/edit">) {
  const route = operationIdSchema.safeParse((await params).operationId);
  if (!route.success) notFound();

  let operation;
  let contracts;
  try {
    [operation, contracts] = await Promise.all([
      getOperationById(route.data),
      listContracts(),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Editar operação</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/operations/${operation.id}`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
      </Button>
      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Editar operação</h1>
        <p className="mt-2 text-sm text-muted-foreground">{operation.name}</p>
      </div>
      <section className="mt-8 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <OperationForm contracts={contracts} operation={operation} />
      </section>
    </main>
  );
}
