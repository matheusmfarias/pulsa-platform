"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unexpected page error", { digest: error.digest });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Não foi possível carregar esta página</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente. Se o problema persistir, contate o suporte interno.
        </p>
        <Button className="mt-6" onClick={reset}>
          Tentar novamente
        </Button>
      </section>
    </main>
  );
}
