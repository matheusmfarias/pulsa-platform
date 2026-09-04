import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PermissionGate } from "@/modules/authorization";
import {
  ContractStatusAction,
  ContractStatusBadge,
  contractIdSchema,
  getContractById,
} from "@/modules/contracts";
import {
  listOperations,
  OperationStatusBadge,
  type OperationWithContext,
} from "@/modules/operations";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const relationLinkClass =
  "rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function formatDate(value: string | null): string {
  if (!value) return "Em aberto";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 text-sm leading-6">{value}</dd>
    </div>
  );
}

function DetailSection({
  id,
  title,
  description,
  actions,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold" id={id}>
            {title}
          </h2>

          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </header>

      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function ContractDetailsPage({
  params,
}: PageProps<"/app/contracts/[contractId]">) {
  const route = contractIdSchema.safeParse((await params).contractId);

  if (!route.success) {
    notFound();
  }

  let contract;

  try {
    contract = await getContractById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <PageShell>
        <ContentContainer size="detail-wide">
          <PageHeader
            breadcrumb={
              <Breadcrumb items={[{ label: "Comercial" }, { label: "Contratos" }]} />
            }
            title="Detalhe do contrato"
          />

          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  let operations: OperationWithContext[];
  let operationsError: string | null = null;

  try {
    operations = await listOperations({
      contractId: contract.id,
    });
  } catch (error) {
    operations = [];
    operationsError = toPublicErrorMessage(error);
  }

  return (
    <PageShell>
      <ContentContainer size="detail-wide">
        <PageHeader
          actions={
            <PermissionGate permission="contract:update">
              <Button asChild variant="outline">
                <Link href={`/app/contracts/${contract.id}/edit`}>
                  <Pencil aria-hidden="true" className="size-4" />
                  Editar
                </Link>
              </Button>
            </PermissionGate>
          }
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Comercial" },
                {
                  label: "Clientes",
                  href: "/app/clients",
                },
                {
                  label: contract.client.trade_name,
                  href: `/app/clients/${contract.client.id}`,
                },
                {
                  label: contract.name,
                },
              ]}
            />
          }
          description="Vínculo comercial, período e operações associadas a este contrato."
          metadata={<ContractStatusBadge status={contract.status} />}
          title={contract.name}
        />

        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <DetailSection
            description="Informações comerciais que identificam este contrato e seu período de vigência."
            id="contract-data"
            title="Dados do contrato"
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                label="Cliente"
                value={
                  <Link
                    className={relationLinkClass}
                    href={`/app/clients/${contract.client.id}`}
                  >
                    {contract.client.trade_name}
                  </Link>
                }
              />

              <DetailItem
                label="Referência externa"
                value={contract.external_reference ?? "Não informada"}
              />

              <DetailItem
                label="Data inicial"
                value={
                  <span className="tabular-nums">
                    {formatDate(contract.start_date)}
                  </span>
                }
              />

              <DetailItem
                label="Data final"
                value={
                  <span className="tabular-nums">
                    {formatDate(contract.end_date)}
                  </span>
                }
              />
            </dl>
          </DetailSection>

          <DetailSection
            actions={
              contract.status === "active" ? (
                <PermissionGate permission="operation:create">
                  <Button asChild className="w-fit" size="sm">
                    <Link
                      href={`/app/operations/new?contractId=${contract.id}`}
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      Nova operação
                    </Link>
                  </Button>
                </PermissionGate>
              ) : null
            }
            description="Engajamentos operacionais vinculados a este contrato."
            id="contract-operations"
            title="Operações"
          >
            {operationsError ? (
              <FeedbackMessage variant="danger">
                {operationsError}
              </FeedbackMessage>
            ) : operations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este contrato ainda não possui operações cadastradas.
              </p>
            ) : (
              <ul className="divide-y divide-border-default">
                {operations.map((operation) => (
                  <li
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    key={operation.id}
                  >
                    <div className="min-w-0">
                      <Link
                        className={relationLinkClass}
                        href={`/app/operations/${operation.id}`}
                      >
                        {operation.name}
                      </Link>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {formatDate(operation.start_date)}
                        <span aria-hidden="true"> — </span>
                        {formatDate(operation.end_date)}
                      </p>
                    </div>

                    <div className="w-fit self-start sm:self-auto">
                      <OperationStatusBadge status={operation.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <PermissionGate permission="contract:update">
            <DetailSection
              description="Altere somente a situação do contrato. Os vínculos e o histórico comercial permanecem preservados."
              id="contract-status"
              title="Situação do contrato"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Situação atual
                  </span>

                  <ContractStatusBadge status={contract.status} />
                </div>

                <div className="w-fit">
                  <ContractStatusAction
                    contractId={contract.id}
                    currentStatus={contract.status}
                  />
                </div>
              </div>
            </DetailSection>
          </PermissionGate>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
