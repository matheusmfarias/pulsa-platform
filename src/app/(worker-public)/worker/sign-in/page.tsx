import { redirect } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { getAuthenticatedUser } from "@/modules/auth";
import {
  getOptionalWorkerAccess,
  WorkerSignInForm,
} from "@/modules/worker-access";
import { workerInvitationTokenSchema } from "@/modules/worker-access/schemas/worker-access-schemas";

export default async function WorkerSignInPage({
  searchParams,
}: PageProps<"/worker/sign-in">) {
  const query = await searchParams;
  const invitation = query.invitation;
  const parsedInvitation = workerInvitationTokenSchema.safeParse(invitation);
  const invitationToken = parsedInvitation.success
    ? parsedInvitation.data
    : undefined;
  const otpMode = query.mode === "code";
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
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          {invitationToken
            ? "Acesse seu convite"
            : otpMode
              ? "Entre com um código"
              : "Acesse sua conta"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {invitationToken
            ? "Informe o e-mail que recebeu o convite e o código enviado pela Pulsa."
            : otpMode
              ? "Informe um código recebido ou solicite um novo."
              : "Use o e-mail e a senha da sua conta Pulsa Worker."}
        </p>
        <WorkerSignInForm invitationToken={invitationToken} otpMode={otpMode} />
      </section>
    </main>
  );
}
