import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { listJobRoles } from "@/modules/job-roles";
import { PositionForm } from "@/modules/positions";
import { listUnits } from "@/modules/units";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function NewPositionPage() {
  let units;
  let jobRoles;

  try {
    [units, jobRoles] = await Promise.all([
      listUnits({ status: "active" }),
      listJobRoles({ status: "active" }),
    ]);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="form">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[
                  { label: "Operação" },
                  { label: "Postos", href: "/app/positions" },
                  { label: "Novo posto" },
                ]}
              />
            }
            description="Cadastre um posto em uma unidade operacional ativa."
            title="Novo posto"
          />
          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  const canCreate = units.length > 0 && jobRoles.length > 0;

  return (
    <PageShell>
      <ContentContainer size="form">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Operação" },
                { label: "Postos", href: "/app/positions" },
                { label: "Novo posto" },
              ]}
            />
          }
          description="Cadastre um posto em uma unidade operacional ativa."
          title="Novo posto"
        />

        {canCreate ? (
          <section
            aria-label="Formulário de cadastro do posto"
            className="mt-8 rounded-surface border border-border-default bg-surface p-6 sm:p-8"
          >
            <PositionForm
              cancelHref="/app/positions"
              jobRoles={jobRoles}
              redirectToPosition
              units={units}
            />
          </section>
        ) : (
          <section className="mt-8 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
            <h2 className="font-medium">
              {!units.length
                ? "Nenhuma unidade ativa disponível"
                : "Nenhum cargo ativo disponível"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              É necessário ter uma unidade e um cargo ativos para cadastrar um
              posto.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href={!units.length ? "/app/units" : "/app/job-roles"}>
                Ver {!units.length ? "unidades" : "cargos"}
              </Link>
            </Button>
          </section>
        )}
      </ContentContainer>
    </PageShell>
  );
}
