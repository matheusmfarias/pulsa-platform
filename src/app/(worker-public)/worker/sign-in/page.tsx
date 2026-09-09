import { redirect } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { getAuthenticatedUser } from "@/modules/auth";
import {
  getOptionalWorkerAccess,
  WorkerSignInForm,
} from "@/modules/worker-access";

export default async function WorkerSignInPage({
  searchParams,
}: PageProps<"/worker/sign-in">) {
  const invitation = (await searchParams).invitation;
  const invitationToken = typeof invitation === "string" ? invitation : undefined;
  const user = await getAuthenticatedUser();
  if (user && (await getOptionalWorkerAccess())) redirect("/worker");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-8 sm:px-6 sm:py-12">
      <section className="w-full rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="border-l pl-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Worker
          </span>
        </div>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Acesse sua conta</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use o e-mail que recebeu o convite da Pulsa. Enviaremos um código para confirmar seu acesso.
        </p>
        <WorkerSignInForm invitationToken={invitationToken} />
      </section>
    </main>
  );
}
