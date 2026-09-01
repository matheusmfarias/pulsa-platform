import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listOperations } from "@/modules/operations";
import { UnitForm } from "@/modules/units";
export default async function NewUnitPage({
  searchParams,
}: PageProps<"/app/units/new">) {
  const operationId = (await searchParams).operationId;
  const operations = await listOperations();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/units">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>
      <h1 className="mt-6 text-2xl font-semibold">Nova unidade</h1>
      <section className="mt-8 rounded-lg border bg-card p-6">
        <UnitForm
          operations={operations}
          defaultOperationId={
            typeof operationId === "string" ? operationId : undefined
          }
        />
      </section>
    </main>
  );
}
