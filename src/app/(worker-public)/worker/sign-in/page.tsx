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
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-6 py-12">
      <section className="w-full rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <BrandMark />
        <h1 className="mt-10 text-2xl font-semibold tracking-tight">Acesse o Pulsa Worker</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use o e-mail previamente convidado pela sua organização. Este login não cria contas.
        </p>
        <WorkerSignInForm invitationToken={invitationToken} />
      </section>
    </main>
  );
}
