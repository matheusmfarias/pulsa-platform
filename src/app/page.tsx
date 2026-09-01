import { redirect } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { getAuthenticatedUser, LoginForm } from "@/modules/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/app");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(30rem,0.72fr)]">
      <section className="hidden border-r bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <p className="text-sm font-medium tracking-wide">PULSA PLATFORM</p>
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.18em] text-primary-foreground/65">
            Operação com clareza
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Uma base confiável para pessoas, operações e performance.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/75">
            Acesso interno ao ambiente operacional da Pulsa.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/55">Uso restrito a pessoas autorizadas.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <BrandMark />
          <div className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight">Acesse sua conta</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use seu e-mail corporativo e senha para continuar.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
