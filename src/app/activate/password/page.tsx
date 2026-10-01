import { redirect } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { CoreActivationPasswordForm } from "@/modules/auth/components/core-activation-password-form";
import { requireActiveOrganization } from "@/modules/organizations";

export default async function CoreActivationPasswordPage() {
  try {
    await requireActiveOrganization();
  } catch {
    redirect("/activate");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <section className="w-full max-w-md rounded-surface border border-border-default bg-surface p-6 shadow-sm sm:p-8">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-semibold">Crie sua senha</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Seu código foi confirmado. Defina uma senha para acessar o Pulsa Core.</p>
        <CoreActivationPasswordForm />
      </section>
    </main>
  );
}
