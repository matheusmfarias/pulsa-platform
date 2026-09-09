import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WorkerPasswordForm } from "@/modules/worker-access";

export default function WorkerAccountPasswordPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href="/worker/account"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para Conta
      </Link>

      <section className="mt-4 max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">Segurança da conta</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Alterar senha</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Defina uma nova senha para sua conta.
        </p>
        <WorkerPasswordForm mode="change" />
      </section>
    </main>
  );
}
