import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { clientIdSchema, listClients } from "@/modules/clients";
import { ContractForm } from "@/modules/contracts";
import { toPublicErrorMessage } from "@/shared/errors";

type SearchParams = Promise<{ clientId?: string }>;

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const requestedClient = clientIdSchema.safeParse((await searchParams).clientId);

  let clients;
  try {
    clients = await listClients({ query: "", status: "active" });
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Novo contrato</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/contracts">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
      </Button>
      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Novo contrato</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registre o vínculo comercial de um cliente ativo.
        </p>
      </div>
      {clients.length === 0 ? (
        <section className="mt-8 rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            É necessário ter ao menos um cliente ativo para criar um contrato.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/app/clients">Ver clientes</Link>
          </Button>
        </section>
      ) : (
        <section className="mt-8 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
          <ContractForm
            clients={clients}
            defaultClientId={requestedClient.success ? requestedClient.data : undefined}
          />
        </section>
      )}
    </main>
  );
}
