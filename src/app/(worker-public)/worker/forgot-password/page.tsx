import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { WorkerForgotPasswordForm } from "@/modules/worker-access";

export default function WorkerForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-8 sm:px-6 sm:py-12">
      <section className="w-full rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="border-l pl-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Worker
          </span>
        </div>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Informe seu e-mail para receber as instruções de recuperação.
        </p>
        <WorkerForgotPasswordForm />
        <Link className="mt-5 inline-flex min-h-11 w-full items-center justify-center text-sm text-action-primary hover:underline" href="/worker/sign-in">
          Voltar para entrar
        </Link>
      </section>
    </main>
  );
}
