import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function WorkerNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Colaborador não encontrado</h1>
      <Button asChild className="mt-6">
        <Link href="/app/workers">Ver colaboradores</Link>
      </Button>
    </main>
  );
}
