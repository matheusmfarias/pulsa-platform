"use client";
import { Button } from "@/components/ui/button";
export default function UnitsError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">
        Não foi possível carregar as unidades
      </h1>
      <Button className="mt-6" onClick={reset}>
        Tentar novamente
      </Button>
    </main>
  );
}
