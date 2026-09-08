import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { AbsenceTable, listAbsences } from "@/modules/absences";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { resolveOperationalContext } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function AbsencesPage({ searchParams }: PageProps<"/app/absences">) {
  let absences;
  let withoutCoverage = false;
  try {
    const { context } = await resolveOperationalContext();
    withoutCoverage = (await searchParams).coverage === "uncovered";
    absences = await listAbsences(context, { withoutCoverage });
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Ausências" }]} />}
            description="Acompanhe impedimentos registrados sobre entradas de escala."
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
          description="Acompanhe impedimentos registrados sobre entradas de escala."
          title="Ausências"
        />
        <div className="mt-5 sm:mt-6">
          <div className="mb-4 flex items-center gap-2"><Button asChild size="sm" variant={withoutCoverage ? "outline" : "default"}><Link href="/app/absences?coverage=uncovered">Sem cobertura</Link></Button>{withoutCoverage ? <Button asChild size="sm" variant="ghost"><Link href="/app/absences">Limpar filtro</Link></Button> : null}</div>
          {absences.length ? (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium tabular-nums text-foreground">
                  {absences.length}
                </span>{" "}
                {absences.length === 1 ? "ausência encontrada" : "ausências encontradas"}
              </p>
              <AbsenceTable absences={absences} />
            </>
          ) : (
            <section className="rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:mt-4 sm:py-10">
              <h2 className="font-medium">Nenhuma ausência registrada</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                As ausências registradas nas entradas de escala aparecerão aqui.
              </p>
            </section>
          )}
        </div>
      </ContentContainer>
    </PageShell>
  );
}
