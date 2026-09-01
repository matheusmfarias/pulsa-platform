"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function OperationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Operations route error", { digest: error.digest });
  }, [error]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="max-w-xl rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold">Não foi possível carregar operações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente. Se o problema persistir, contate o suporte interno.
        </p>
        <Button className="mt-5" onClick={reset}>Tentar novamente</Button>
      </section>
    </main>
  );
}
