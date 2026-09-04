import { Plus } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import { resolveOperationalContext } from "@/modules/operational-context";
import {
  listUnitOperationalSummaries,
  UnitTable,
} from "@/modules/units";
import { toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default async function UnitsPage() {
  let units;

  try {
    const { context } = await resolveOperationalContext();
    units = await listUnitOperationalSummaries(context);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Unidades" }]} />}
            description="Locais vinculados às operações."
            title="Unidades"
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
          actions={
            <PermissionGate permission="unit:create">
              <Button asChild>
                <Link href="/app/units/new">
                  <Plus aria-hidden="true" className="size-4" />
                  Nova unidade
                </Link>
              </Button>
            </PermissionGate>
          }
          description="Locais vinculados às operações."
          breadcrumb={<Breadcrumb items={[{ label: "Operação" }, { label: "Unidades" }]} />}
          title="Unidades"
        />

        <div className="mt-5 sm:mt-6">
          {units.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {units.length}
              </span>{" "}
              {units.length === 1
                ? "unidade encontrada"
                : "unidades encontradas"}
            </p>
          ) : null}

          {units.length === 0 ? (
            <section className="rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:mt-4 sm:py-10">
              <h2 className="font-medium">Nenhuma unidade cadastrada</h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                As unidades representam os locais vinculados às operações.
              </p>

              <PermissionGate permission="unit:create">
                <Button asChild className="mt-5">
                  <Link href="/app/units/new">
                    <Plus aria-hidden="true" className="size-4" />
                    Nova unidade
                  </Link>
                </Button>
              </PermissionGate>
            </section>
          ) : (
            <UnitTable units={units} />
          )}
        </div>
      </ContentContainer>
    </PageShell>
  );
}
