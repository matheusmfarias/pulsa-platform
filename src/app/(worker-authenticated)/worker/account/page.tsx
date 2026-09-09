import { CircleCheck, LogOut, Mail, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/modules/auth";
import {
  requireWorkerAccess,
  workerLogoutAction,
} from "@/modules/worker-access";

export default async function WorkerAccountPage() {
  const [user, access] = await Promise.all([
    getAuthenticatedUser(),
    requireWorkerAccess(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-medium text-muted-foreground">Seu perfil</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Conta</h1>

      <section
        aria-labelledby="worker-account-details"
        className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <h2 className="sr-only" id="worker-account-details">
          Dados da conta
        </h2>
        <div className="flex items-center gap-4 p-5 sm:p-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hover text-action-primary">
            <UserRound aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{access.workerName}</p>
            <p className="mt-1 flex items-center gap-2 truncate text-sm text-muted-foreground">
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              {user?.email ?? "E-mail não disponível"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t bg-muted/40 px-5 py-3 text-sm font-medium text-status-success-foreground sm:px-6">
          <CircleCheck aria-hidden="true" className="size-4" />
          Acesso ativo
        </div>
      </section>

      <form action={workerLogoutAction} className="mt-6">
        <Button className="h-12 w-full sm:w-auto" type="submit" variant="outline">
          <LogOut aria-hidden="true" className="size-4" />
          Sair da conta
        </Button>
      </form>
    </main>
  );
}
