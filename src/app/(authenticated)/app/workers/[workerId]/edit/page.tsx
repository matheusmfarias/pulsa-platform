import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
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
            eyebrow="Colaboradores"
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
        <Button asChild size="sm" variant="ghost">
          <Link href={"/app/workers/" + worker.id}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>
        <PageHeader
          className="mt-6"
          description="Atualize somente os dados cadastrais do colaborador."
          eyebrow="Colaboradores"
          metadata={<span className="font-medium text-foreground">{worker.full_name}</span>}
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
