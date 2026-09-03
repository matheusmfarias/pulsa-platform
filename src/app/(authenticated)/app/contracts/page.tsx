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
import {
  ContractTable,
  listContracts,
} from "@/modules/contracts";
import { resolveOperationalContext } from "@/modules/operational-context";
import { toPublicErrorMessage } from "@/shared/errors";

export default async function ContractsPage() {
  let contracts;

  try {
    const { context } = await resolveOperationalContext();
    contracts = await listContracts({}, context);
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            description="Vínculos comerciais dos clientes atendidos pela Pulsa."
            eyebrow="Comercial"
            title="Contratos"
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
            <PermissionGate permission="contract:create">
              <Button asChild>
                <Link href="/app/contracts/new">
                  <Plus aria-hidden="true" className="size-4" />
                  Novo contrato
                </Link>
              </Button>
            </PermissionGate>
          }
          description="Vínculos comerciais dos clientes atendidos pela Pulsa."
          eyebrow="Comercial"
          title="Contratos"
        />

        <div className="mt-5 sm:mt-6">
          {contracts.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {contracts.length}
              </span>{" "}
              {contracts.length === 1
                ? "contrato encontrado"
                : "contratos encontrados"}
            </p>
          ) : null}

          {contracts.length === 0 ? (
            <section className="mt-4 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
              <h2 className="font-medium">
                Nenhum contrato cadastrado
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Os contratos representam os vínculos comerciais estabelecidos com os clientes.
              </p>
            </section>
          ) : (
            <ContractTable contracts={contracts} />
          )}
        </div>
      </ContentContainer>
    </PageShell>
  );
}