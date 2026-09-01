import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { contractIdSchema, listContracts } from "@/modules/contracts";
import { OperationForm } from "@/modules/operations";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{ contractId?: string }>;

export default async function NewOperationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const requestedContract = contractIdSchema.safeParse(
    (await searchParams).contractId,
  );

  let contracts;
  try {
    contracts = await listContracts({ status: "active" });
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Nova operação</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/operations">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
      </Button>
      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nova operação</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registre um engajamento operacional para um contrato ativo.
        </p>
      </div>
      {contracts.length === 0 ? (
        <section className="mt-8 rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            É necessário ter ao menos um contrato ativo para criar uma operação.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/app/contracts">Ver contratos</Link>
          </Button>
        </section>
      ) : (
        <section className="mt-8 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
          <OperationForm
            contracts={contracts}
            defaultContractId={
              requestedContract.success ? requestedContract.data : undefined
            }
          />
        </section>
      )}
    </main>
  );
}
