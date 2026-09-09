import { WorkerPasswordForm } from "@/modules/worker-access";

export default function WorkerSetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-12">
      <section className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">Segurança da conta</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Crie sua senha</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Defina a senha que você usará para acessar o Pulsa Worker.
        </p>
        <WorkerPasswordForm mode="create" />
      </section>
    </main>
  );
}
