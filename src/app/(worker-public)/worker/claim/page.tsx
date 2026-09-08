import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/modules/auth";
import {
  getOptionalWorkerAccess,
  getWorkerAccessClaim,
  WorkerClaimForm,
} from "@/modules/worker-access";

export default async function WorkerClaimPage({
  searchParams,
}: PageProps<"/worker/claim">) {
  const invitation = (await searchParams).invitation;
  const invitationToken = typeof invitation === "string" ? invitation : "";
  const user = await getAuthenticatedUser();
  if (!user) redirect("/worker/sign-in");
  if (await getOptionalWorkerAccess()) redirect("/worker");

  const claim = await getWorkerAccessClaim(invitationToken);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-6 py-12">
      <section className="w-full rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">Primeiro acesso</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Ative seu acesso</h1>
        {claim ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Vínculo destinado a</p>
              <p className="mt-1 font-medium">{claim.workerName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{claim.invitationEmail}</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              A ativação usa somente sua sessão autenticada. Nenhum identificador de colaborador ou organização é enviado pelo navegador.
            </p>
            <WorkerClaimForm invitationToken={invitationToken} />
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
            Não há um convite válido destinado a esta conta.
          </div>
        )}
      </section>
    </main>
  );
}
