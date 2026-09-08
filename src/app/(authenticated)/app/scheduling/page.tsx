import { Plus } from "lucide-react";
import Link from "next/link";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import { resolveOperationalContext } from "@/modules/operational-context";
import { listScheduleOverviews, ScheduleTable } from "@/modules/scheduling";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function SchedulingPage() {
  let schedules;
  try {
    const { context } = await resolveOperationalContext();
    schedules = await listScheduleOverviews(context);
  } catch (error) {
    return <PageShell><ContentContainer size="list"><PageHeader breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Escalas" }]} />} description="Planejamentos de escala por operação e período civil." title="Escalas" /><FeedbackMessage className="mt-6" variant="danger">{toPublicErrorMessage(error)}</FeedbackMessage></ContentContainer></PageShell>;
  }
  return <PageShell><ContentContainer size="list"><PageHeader actions={<PermissionGate permission="schedule:create"><Button asChild><Link href="/app/scheduling/new"><Plus aria-hidden="true" className="size-4" />Nova escala</Link></Button></PermissionGate>} breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Escalas" }]} />} description="Planejamentos de escala por operação e período civil." title="Escalas" />
    <div className="mt-5 sm:mt-6">{schedules.length ? <><p className="text-sm text-muted-foreground"><span className="font-medium tabular-nums text-foreground">{schedules.length}</span> {schedules.length === 1 ? "escala encontrada" : "escalas encontradas"}</p><ScheduleTable schedules={schedules} /></> : <section className="rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:mt-4 sm:py-10"><h2 className="font-medium">Nenhuma escala cadastrada</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Crie uma escala para organizar um período explícito de uma operação.</p></section>}</div>
  </ContentContainer></PageShell>;
}
