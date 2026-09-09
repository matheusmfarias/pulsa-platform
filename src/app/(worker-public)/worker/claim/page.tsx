import { redirect } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { getAuthenticatedUser } from "@/modules/auth";
import {
  getOptionalWorkerAccess,
  getWorkerAccessClaim,
  WorkerClaimForm,
} from "@/modules/worker-access";

export default async function WorkerClaimPage({
  searchParams,
}: PageProps<"/worker/claim">) {
  const query = await searchParams;
  const invitation = query.invitation;
  const claimError = query.error;
  const invitationToken = typeof invitation === "string" ? invitation : "";
  const user = await getAuthenticatedUser();
  if (!user) redirect("/worker/sign-in");
  if (await getOptionalWorkerAccess()) redirect("/worker");

  const claim = await getWorkerAccessClaim(invitationToken);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-8 sm:px-6 sm:py-12">
      <section className="w-full rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="border-l pl-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Worker
          </span>
        </div>
        <p className="mt-8 text-sm font-medium text-muted-foreground">Primeiro acesso</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Confirme seu acesso</h1>
        {claim ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Este acesso será vinculado a:</p>
              <p className="mt-2 text-lg font-semibold">{claim.workerName}</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{claim.invitationEmail}</p>
            </div>
            {claimError === "unavailable" ? (
              <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                Não foi possível ativar este acesso. Solicite um novo convite ao responsável.
              </p>
            ) : null}
            <WorkerClaimForm invitationToken={invitationToken} />
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm leading-6 text-destructive" role="alert">
            Este convite não está mais disponível. Solicite um novo convite ao responsável pelo seu acesso.
          </div>
        )}
      </section>
    </main>
  );
}
