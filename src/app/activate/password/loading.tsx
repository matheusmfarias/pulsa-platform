import { BrandMark } from "@/components/shared/brand-mark";

function Bone({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-control bg-subtle ${className}`}
    />
  );
}

export default function CoreActivationPasswordLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <section className="w-full max-w-md rounded-surface border border-border-default bg-surface p-6 shadow-sm sm:p-8">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-semibold">Crie sua senha</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Seu código foi confirmado. Defina uma senha para acessar o Pulsa Core.
        </p>
        <div aria-busy="true" aria-label="Carregando formulário de senha" className="mt-8 space-y-5" role="status">
          <span className="sr-only">Carregando formulário de senha…</span>
          <div className="space-y-2">
            <Bone className="h-3 w-24" />
            <Bone className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-36" />
            <Bone className="h-10 w-full" />
          </div>
          <Bone className="h-10 w-full" />
        </div>
      </section>
    </main>
  );
}
