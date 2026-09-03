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
import { listOperations, OperationTable } from "@/modules/operations";
import { resolveOperationalContext } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function OperationsPage() {
  let operations;

  try {
    const { context } = await resolveOperationalContext();
    operations = await listOperations({}, context);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            description="Engajamentos operacionais administrados pela Pulsa."
            eyebrow="Execução"
            title="Operações"
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
            <PermissionGate permission="operation:create">
              <Button asChild>
                <Link href="/app/operations/new">
                  <Plus aria-hidden="true" className="size-4" />
                  Nova operação
                </Link>
              </Button>
            </PermissionGate>
          }
          description="Engajamentos operacionais administrados pela Pulsa."
          eyebrow="Execução"
          title="Operações"
        />

        <div className="mt-5 sm:mt-6">
          {operations.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {operations.length}
              </span>{" "}
              {operations.length === 1
                ? "operação encontrada"
                : "operações encontradas"}
            </p>
          ) : null}

          {operations.length === 0 ? (
            <section className="rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:mt-4 sm:py-10">
              <h2 className="font-medium">Nenhuma operação cadastrada</h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                As operações representam os engajamentos executados pela Pulsa
                dentro dos contratos.
              </p>
            </section>
          ) : (
            <OperationTable operations={operations} />
          )}
        </div>
      </ContentContainer>
    </PageShell>
  );
}
