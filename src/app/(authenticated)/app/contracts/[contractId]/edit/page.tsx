import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { listClients } from "@/modules/clients";
import {
  ContractForm,
  contractIdSchema,
  getContractById,
} from "@/modules/contracts";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function EditContractPage({
  params,
}: PageProps<"/app/contracts/[contractId]/edit">) {
  const route = contractIdSchema.safeParse((await params).contractId);
  if (!route.success) notFound();

  let contract;
  let clients;
  try {
    [contract, clients] = await Promise.all([
      getContractById(route.data),
      listClients({ query: "", status: "all" }),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Editar contrato</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/contracts/${contract.id}`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
      </Button>
      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Editar contrato</h1>
        <p className="mt-2 text-sm text-muted-foreground">{contract.name}</p>
      </div>
      <section className="mt-8 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <ContractForm clients={clients} contract={contract} />
      </section>
    </main>
  );
}
