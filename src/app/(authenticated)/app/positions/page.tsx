import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  hasActivePositionFilters,
  listPositionsForGlobalView,
  PositionFilterBar,
  positionGlobalListFiltersSchema,
  PositionTable,
} from "@/modules/positions";
import { resolveOperationalContext } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function PositionsPage({
  searchParams,
}: PageProps<"/app/positions">) {
  const query = await searchParams;

  const filters = positionGlobalListFiltersSchema.parse({
    query: query.q,
    status: query.status === "all" ? undefined : query.status,
  });

  let positions;

  try {
    const { context } = await resolveOperationalContext();

    positions = await listPositionsForGlobalView(filters, context);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            description="Postos operacionais definidos nas unidades."
            eyebrow="Operação"
            title="Postos"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const hasActiveFilters = hasActivePositionFilters(filters);

  return (
    <PageShell>
      <ContentContainer size="list">
        <PageHeader
          description="Postos operacionais definidos nas unidades."
          eyebrow="Operação"
          title="Postos"
        />

        <PositionFilterBar filters={filters} />

        <div className="mt-6">
          {positions.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {positions.length}
              </span>{" "}
              {positions.length === 1
                ? "posto encontrado"
                : "postos encontrados"}
              {hasActiveFilters ? " com os filtros atuais" : ""}
            </p>
          ) : hasActiveFilters ? (
            <p className="text-sm text-muted-foreground">
              Nenhum posto encontrado com os filtros atuais
            </p>
          ) : null}

          {positions.length === 0 ? (
            <section className="mt-4 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
              <h2 className="font-medium">
                {hasActiveFilters
                  ? "Nenhum posto corresponde aos filtros"
                  : "Nenhum posto cadastrado"}
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {hasActiveFilters
                  ? "Ajuste a busca, altere o status ou limpe os filtros para visualizar outros postos."
                  : "Os postos representam a estrutura operacional definida dentro das unidades."}
              </p>
            </section>
          ) : (
            <PositionTable positions={positions} />
          )}
        </div>
      </ContentContainer>
    </PageShell>
  );
}
