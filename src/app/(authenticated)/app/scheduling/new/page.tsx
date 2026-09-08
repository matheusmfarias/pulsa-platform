import Link from "next/link";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { getAuthorizationContext } from "@/modules/authorization";
import { listOperations } from "@/modules/operations";
import { resolveOperationalContext } from "@/modules/operational-context";
import { listPublishedScheduleCopySources, listScheduleOverviews, ScheduleForm } from "@/modules/scheduling";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function NewSchedulePage() {
  let operations; let organizationId; let copySources; let schedulePeriods;
  try {
    const [{ context }, authorization] = await Promise.all([resolveOperationalContext(), getAuthorizationContext()]);
    [operations, copySources, schedulePeriods] = await Promise.all([listOperations({ status: "active" }, context), listPublishedScheduleCopySources(context), listScheduleOverviews(context)]);
    organizationId = authorization.organizationId;
  } catch (error) {
    return <PageShell><ContentContainer size="form"><PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Escalas", href: "/app/scheduling" }, { label: "Nova escala" }]} />} title="Nova escala" /><FeedbackMessage className="mt-6" variant="danger">{toPublicErrorMessage(error)}</FeedbackMessage></ContentContainer></PageShell>;
  }
  return <PageShell><ContentContainer size="form"><PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Escalas", href: "/app/scheduling" }, { label: "Nova escala" }]} />} description="Defina a operação e o período civil da escala." title="Nova escala" />{operations.length ? <section aria-label="Formulário de cadastro da escala" className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"><ScheduleForm copySources={copySources} operations={operations} organizationId={organizationId} schedulePeriods={schedulePeriods} /></section> : <section className="mt-8 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10"><h2 className="font-medium">Nenhuma operação ativa disponível</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Crie ou ative uma operação antes de criar uma escala.</p><Button asChild className="mt-5" variant="outline"><Link href="/app/operations">Ver operações</Link></Button></section>}</ContentContainer></PageShell>;
}
