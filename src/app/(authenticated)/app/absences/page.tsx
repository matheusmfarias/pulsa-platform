import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { AbsenceTable, listAbsences } from "@/modules/absences";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getOperationalContextSelection } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function AbsencesPage({ searchParams }: PageProps<"/app/absences">) {
  let absences;
  let withoutCoverage = false;
  try {
    const context = await getOperationalContextSelection();
    withoutCoverage = (await searchParams).coverage === "uncovered";
    absences = await listAbsences(context, { withoutCoverage });
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Ausências" }]} />}
            description="Veja quem não poderá cumprir a jornada e acompanhe a cobertura."
            title="Ausências"
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
      <ContentContainer size="list">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Ausências" }]} />}
          description="Veja quem não poderá cumprir a jornada e acompanhe a cobertura."
          title="Ausências"
        />
        <div className="mt-5 sm:mt-6">
          <nav aria-label="Filtrar ausências por cobertura" className="mb-4 flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant={withoutCoverage ? "outline" : "default"}>
              <Link aria-current={!withoutCoverage ? "page" : undefined} href="/app/absences">Todas</Link>
            </Button>
            <Button asChild size="sm" variant={withoutCoverage ? "default" : "outline"}>
              <Link aria-current={withoutCoverage ? "page" : undefined} href="/app/absences?coverage=uncovered">Sem cobertura</Link>
            </Button>
          </nav>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{absences.length}</span>{" "}
            {absences.length === 1 ? "ausência encontrada" : "ausências encontradas"}
            {withoutCoverage ? " sem cobertura" : ""}
          </p>
          {absences.length ? (
            <AbsenceTable absences={absences} />
          ) : (
            <section className="mt-4 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
              <h2 className="font-medium">
                {withoutCoverage ? "Nenhuma ausência sem cobertura" : "Nenhuma ausência registrada"}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {withoutCoverage
                  ? "As ausências com substituto definido continuam disponíveis em Todas."
                  : "As ausências registradas na escala aparecerão aqui."}
              </p>
            </section>
          )}
        </div>
      </ContentContainer>
    </PageShell>
  );
}
