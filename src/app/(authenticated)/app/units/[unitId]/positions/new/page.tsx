import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { listJobRoles } from "@/modules/job-roles";
import { PositionForm } from "@/modules/positions";
import { getUnitById, unitIdSchema } from "@/modules/units";

export default async function NewPositionPage({
  params,
}: PageProps<"/app/units/[unitId]/positions/new">) {
  const route = unitIdSchema.safeParse((await params).unitId);
  if (!route.success) notFound();

  const [unit, jobRoles] = await Promise.all([
    getUnitById(route.data),
    listJobRoles({ status: "active" }),
  ]);

  return (
    <PageShell>
      <ContentContainer size="form">
        <Button asChild size="sm" variant="ghost">
          <Link href={`/app/units/${unit.id}`}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
        </Button>

        <PageHeader
          className="mt-5 sm:mt-6"
          description="Cadastre um posto dentro da estrutura operacional desta unidade."
          eyebrow="Postos"
          metadata={
            <span>
              Unidade:{" "}
              <span className="font-medium text-foreground">{unit.name}</span>
            </span>
          }
          title="Novo posto"
        />

        {unit.status !== "active" ? (
          <FeedbackMessage className="mt-8" variant="warning">
            Ative a unidade antes de cadastrar um posto.
          </FeedbackMessage>
        ) : (
          <section
            aria-label="Formulário de cadastro do posto"
            className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
          >
            <PositionForm
              cancelHref={`/app/units/${unit.id}`}
              jobRoles={jobRoles}
              unitId={unit.id}
            />
          </section>
        )}
      </ContentContainer>
    </PageShell>
  );
}