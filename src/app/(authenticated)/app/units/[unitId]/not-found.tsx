import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function UnitNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Unidade não encontrada</h1>
      <Button asChild className="mt-6">
        <Link href="/app/units">Ver unidades</Link>
      </Button>
    </main>
  );
}
