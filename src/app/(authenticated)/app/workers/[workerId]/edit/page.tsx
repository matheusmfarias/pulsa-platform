import { notFound } from "next/navigation";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { getWorkerById, WorkerForm, workerIdSchema } from "@/modules/workers";
import { parseWorkerDetailTab } from "@/modules/workers/components/worker-detail-navigation";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function EditWorkerPage({
  params,
  searchParams,
}: PageProps<"/app/workers/[workerId]/edit">) {
  const route = workerIdSchema.safeParse((await params).workerId);
  if (!route.success) notFound();
  const returnTab = parseWorkerDetailTab((await searchParams).tab);
  const detailHref = `/app/workers/${route.data}${returnTab === "assignments" ? "" : `?tab=${returnTab}`}`;

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
    <PageShell className="sm:py-7">
      <ContentContainer className="max-w-4xl" size="form">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Pessoas" }, { label: "Colaboradores", href: "/app/workers" }, { label: worker.full_name, href: detailHref }, { label: "Editar" }]} />}
          description={worker.full_name}
          title="Editar colaborador"
        />
        <section
          aria-label="Formulário de edição do colaborador"
          className="mt-5 rounded-card bg-surface p-5 shadow-card sm:p-6"
        >
          <WorkerForm
            cancelHref={detailHref}
            returnTab={returnTab}
            worker={worker}
          />
        </section>
      </ContentContainer>
    </PageShell>
  );
}
