import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import {
  AssignmentStatusBadge,
  listAssignments,
} from "@/modules/assignments";
import {
  formatCpf,
  getWorkerById,
  workerIdSchema,
  WorkerStatusAction,
  WorkerStatusBadge,
} from "@/modules/workers";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string | null): string {
  if (!value) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function WorkerDetailsPage({
  params,
}: PageProps<"/app/workers/[workerId]">) {
  const route = workerIdSchema.safeParse((await params).workerId);
  if (!route.success) notFound();
  let worker;
  let assignments;
  try {
    [worker, assignments] = await Promise.all([
      getWorkerById(route.data),
      listAssignments({ workerId: route.data }),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-destructive">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/workers">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para colaboradores
        </Link>
      </Button>
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {worker.full_name}
            </h1>
            <WorkerStatusBadge status={worker.status} />
          </div>
          <p className="mt-2 text-sm tabular-nums text-muted-foreground">
            {formatCpf(worker.document_number)}
          </p>
        </div>
        <PermissionGate permission="worker:update">
          <Button asChild variant="outline">
            <Link href={`/app/workers/${worker.id}/edit`}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Link>
          </Button>
        </PermissionGate>
      </div>
      <section className="mt-8 rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Dados do colaborador</h2>
        </div>
        <dl className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">
              E-mail
            </dt>
            <dd className="mt-2 text-sm">{worker.email ?? "Não informado"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">
              Telefone
            </dt>
            <dd className="mt-2 text-sm">{worker.phone ?? "Não informado"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">
              Início do vínculo
            </dt>
            <dd className="mt-2 text-sm">
              {formatDate(worker.engagement_start_date)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">
              Fim do vínculo
            </dt>
            <dd className="mt-2 text-sm">
              {formatDate(worker.engagement_end_date)}
            </dd>
          </div>
        </dl>
      </section>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Status do colaborador</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          As mudanças são explícitas e preservam o histórico operacional.
        </p>
        <div className="mt-4">
          <PermissionGate permission="worker:update">
            <WorkerStatusAction
              workerId={worker.id}
              currentStatus={worker.status}
            />
          </PermissionGate>
        </div>
      </section>
      <section className="mt-6 rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-semibold">Alocações</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Histórico de postos vinculados a este colaborador.
            </p>
          </div>
          {worker.status === "active" ? (
            <PermissionGate permission="assignment:create">
              <Button asChild size="sm">
                <Link href={`/app/assignments/new?workerId=${worker.id}`}>
                  <Plus className="size-4" aria-hidden="true" />
                  Nova alocação
                </Link>
              </Button>
            </PermissionGate>
          ) : null}
        </div>
        {assignments.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Nenhuma alocação relacionada.
          </p>
        ) : (
          <ul className="divide-y">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <Link
                    className="font-medium hover:underline"
                    href={`/app/assignments/${assignment.id}`}
                  >
                    {assignment.position.job_role.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {assignment.position.unit.name} · {assignment.start_date} —{" "}
                    {assignment.end_date ?? "em aberto"}
                  </p>
                </div>
                <AssignmentStatusBadge status={assignment.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
