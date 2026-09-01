import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function OperationNotFound() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-lg border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Operação não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O registro não existe ou não está disponível para sua organização.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/app/operations">Voltar para operações</Link>
        </Button>
      </section>
    </main>
  );
}
