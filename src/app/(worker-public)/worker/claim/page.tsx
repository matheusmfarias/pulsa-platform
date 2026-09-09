import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/modules/auth";
import {
  getOptionalWorkerAccess,
  getMyPendingWorkerAccessClaim,
  getMyWorkerAccessHistoryState,
  getWorkerClaimExperience,
  getWorkerAccessClaim,
  WorkerClaimForm,
} from "@/modules/worker-access";

export default async function WorkerClaimPage({
  searchParams,
}: PageProps<"/worker/claim">) {
  const query = await searchParams;
  const invitation = query.invitation;
  const claimError = query.error;
  const invitationToken =
    typeof invitation === "string" && invitation.length > 0
      ? invitation
      : undefined;
  const hasInvitationToken = Boolean(invitationToken);
  const user = await getAuthenticatedUser();
  if (!user) redirect("/worker/sign-in");
  if (await getOptionalWorkerAccess()) redirect("/worker");

  const [claim, hasPriorAccess] = await Promise.all([
    hasInvitationToken
      ? getWorkerAccessClaim(invitationToken)
      : getMyPendingWorkerAccessClaim(),
    getMyWorkerAccessHistoryState(),
  ]);
  const experience = getWorkerClaimExperience(hasPriorAccess);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-8 sm:px-6 sm:py-12">
      <section className="w-full rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="border-l pl-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Worker
          </span>
        </div>
        {claim ? (
          <div>
            <p className="mt-8 text-sm font-medium text-muted-foreground">
              {experience.eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {experience.title}
            </h1>
            <div className="mt-6 space-y-6">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">
                  Este acesso será vinculado a:
                </p>
                <p className="mt-2 text-lg font-semibold">{claim.workerName}</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {claim.invitationEmail}
                </p>
              </div>
            </div>
            {claimError === "unavailable" ? (
              <p
                className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                Não foi possível ativar este acesso. Solicite um novo convite ao
                responsável.
              </p>
            ) : null}
            <WorkerClaimForm
              hasPriorAccess={hasPriorAccess}
              invitationToken={invitationToken}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-lg border bg-muted/40 p-4" role="status">
              <p className="font-medium">
                Seu acesso ao Pulsa Worker não está disponível.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Procure o responsável pelo seu acesso.
              </p>
            </div>
            <Button asChild className="h-12 w-full" variant="outline">
              <Link href="/worker/sign-in">Voltar para entrar</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
