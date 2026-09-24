import { BrandMark } from "@/components/shared/brand-mark";
import { CoreActivationForm } from "@/modules/auth/components/core-activation-form";

export default function CoreActivationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <section className="w-full max-w-md rounded-surface border border-border-default bg-surface p-6 shadow-sm sm:p-8">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-semibold">Ativar acesso ao Pulsa</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Informe o e-mail do convite e o código enviado para você. Depois, escolha uma senha para entrar no sistema.</p>
        <CoreActivationForm />
      </section>
    </main>
  );
}
