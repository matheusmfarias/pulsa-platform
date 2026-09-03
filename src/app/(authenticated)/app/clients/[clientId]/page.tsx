import { ArrowLeft, Pencil, Plus } from "lucide-react";
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
  ClientStatusAction,
  ClientStatusBadge,
  clientIdSchema,
  formatDocumentNumber,
  getClientById,
} from "@/modules/clients";
import {
  ContractStatusBadge,
  listContracts,
  type ContractWithClient,
} from "@/modules/contracts";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

const relationLinkClass =
  "rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatContractDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 text-sm leading-6">
        {value}
      </dd>
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

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

export default async function ClientDetailsPage({
  params,
}: PageProps<"/app/clients/[clientId]">) {
  const route = clientIdSchema.safeParse(
    (await params).clientId,
  );

  if (!route.success) {
    notFound();
  }

  let client;

  try {
    client = await getClientById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <PageShell>
        <ContentContainer size="detail-wide">
          <PageHeader
            eyebrow="Clientes"
            title="Detalhe do cliente"
          />

          <FeedbackMessage
            className="mt-6"
            variant="danger"
          >
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }

  let contracts: ContractWithClient[];
  let contractsError: string | null = null;

  try {
    contracts = await listContracts({
      clientId: client.id,
    });
  } catch (error) {
    contracts = [];
    contractsError = toPublicErrorMessage(error);
  }

  return (
    <PageShell>
      <ContentContainer size="detail-wide">
        <Button asChild size="sm" variant="ghost">
          <Link href="/app/clients">
            <ArrowLeft
              aria-hidden="true"
              className="size-4"
            />
            Voltar para clientes
          </Link>
        </Button>

        <PageHeader
          actions={
            <PermissionGate permission="client:update">
              <Button asChild variant="outline">
                <Link href={`/app/clients/${client.id}/edit`}>
                  <Pencil
                    aria-hidden="true"
                    className="size-4"
                  />
                  Editar
                </Link>
              </Button>
            </PermissionGate>
          }
          className="mt-5 sm:mt-6"
          description="Dados cadastrais e vínculos comerciais deste cliente."
          eyebrow="Clientes"
          metadata={
            <div className="flex flex-wrap items-center gap-3">
              <ClientStatusBadge status={client.status} />

              <span>{client.legal_name}</span>
            </div>
          }
          title={client.trade_name}
        />

        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <DetailSection
            description="Informações jurídicas e comerciais usadas para identificar este cliente."
            id="client-data"
            title="Dados cadastrais"
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                label="Nome fantasia"
                value={client.trade_name}
              />

              <DetailItem
                label="Razão social"
                value={client.legal_name}
              />

              <DetailItem
                label="CNPJ"
                value={
                  <span className="tabular-nums">
                    {formatDocumentNumber(
                      client.document_number,
                    )}
                  </span>
                }
              />

              <DetailItem
                label="Cadastrado em"
                value={formatDate(client.created_at)}
              />
            </dl>
          </DetailSection>

          <DetailSection
            actions={
              client.status === "active" ? (
                <PermissionGate permission="contract:create">
                  <Button
                    asChild
                    className="w-fit"
                    size="sm"
                  >
                    <Link
                      href={`/app/contracts/new?clientId=${client.id}`}
                    >
                      <Plus
                        aria-hidden="true"
                        className="size-4"
                      />
                      Novo contrato
                    </Link>
                  </Button>
                </PermissionGate>
              ) : null
            }
            description="Vínculos comerciais associados a este cliente."
            id="client-contracts"
            title="Contratos"
          >
            {contractsError ? (
              <FeedbackMessage variant="danger">
                {contractsError}
              </FeedbackMessage>
            ) : contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este cliente ainda não possui contratos cadastrados.
              </p>
            ) : (
              <ul className="divide-y divide-border-default">
                {contracts.map((contract) => (
                  <li
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    key={contract.id}
                  >
                    <div className="min-w-0">
                      <Link
                        className={relationLinkClass}
                        href={`/app/contracts/${contract.id}`}
                      >
                        {contract.name}
                      </Link>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Início em{" "}
                        {formatContractDate(
                          contract.start_date,
                        )}
                      </p>
                    </div>

                    <div className="w-fit self-start sm:self-auto">
                      <ContractStatusBadge
                        status={contract.status}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <PermissionGate permission="client:update">
            <DetailSection
              description="Clientes inativos permanecem disponíveis para consulta histórica e não perdem seus vínculos existentes."
              id="client-status"
              title="Situação do cliente"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Situação atual
                  </span>

                  <ClientStatusBadge
                    status={client.status}
                  />
                </div>

                <div className="w-fit">
                  <ClientStatusAction
                    clientId={client.id}
                    currentStatus={client.status}
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