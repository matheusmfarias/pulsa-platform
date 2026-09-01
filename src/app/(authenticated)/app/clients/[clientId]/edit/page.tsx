import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ClientForm, clientIdSchema, getClientById } from "@/modules/clients";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function EditClientPage({
  params,
}: PageProps<"/app/clients/[clientId]/edit">) {
  const route = clientIdSchema.safeParse((await params).clientId);
  if (!route.success) notFound();

  let client;
  try {
    client = await getClientById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();

    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Editar cliente</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/clients/${client.id}`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
      </Button>
      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Editar cliente</h1>
        <p className="mt-2 text-sm text-muted-foreground">{client.trade_name}</p>
      </div>
      <section className="mt-8 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <ClientForm client={client} />
      </section>
    </main>
  );
}
