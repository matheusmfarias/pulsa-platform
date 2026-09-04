import { notFound } from "next/navigation";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { getWorkerById, WorkerForm, workerIdSchema } from "@/modules/workers";
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
      <PageShell>
        <ContentContainer size="form">
          <PageHeader
            breadcrumb={<Breadcrumb items={[{ label: "Pessoas" }, { label: "Colaboradores", href: "/app/workers" }]} />}
            title="Editar colaborador"
          />
          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Pessoas" }, { label: "Colaboradores", href: "/app/workers" }, { label: worker.full_name, href: "/app/workers/" + worker.id }, { label: "Editar" }]} />}
          description="Atualize somente os dados cadastrais do colaborador."
          title="Editar colaborador"
        />
        <section
          aria-label="Formulário de edição do colaborador"
          className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
        >
          <WorkerForm
            cancelHref={"/app/workers/" + worker.id}
            worker={worker}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
