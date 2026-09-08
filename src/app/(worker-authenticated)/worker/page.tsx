import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/modules/auth";
import { requireWorkerAccess } from "@/modules/worker-access";
import { isAppError } from "@/shared/errors";

export default async function WorkerHomePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/worker/sign-in");

  let access;
  try {
    access = await requireWorkerAccess();
  } catch (error) {
    if (isAppError(error) && error.code === "AUTHORIZATION") {
      redirect("/worker/claim");
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <section className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-emerald-700">Acesso ativo</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Olá, {access.workerName}
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Sua área operacional será disponibilizada aqui.
        </p>
      </section>
    </main>
  );
}
