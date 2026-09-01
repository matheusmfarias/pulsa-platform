import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ClientForm } from "@/modules/clients";

export default function NewClientPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/clients">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
      </Button>
      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Novo cliente</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre os dados jurídicos e comerciais da empresa atendida.
        </p>
      </div>
      <section className="mt-8 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <ClientForm />
      </section>
    </main>
  );
}
