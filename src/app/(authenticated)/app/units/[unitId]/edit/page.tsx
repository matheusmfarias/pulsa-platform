import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { listOperations } from "@/modules/operations";
import { getUnitById, UnitForm, unitIdSchema } from "@/modules/units";
export default async function EditUnitPage({
  params,
}: PageProps<"/app/units/[unitId]/edit">) {
  const route = unitIdSchema.safeParse((await params).unitId);
  if (!route.success) notFound();
  const [unit, operations] = await Promise.all([
    getUnitById(route.data),
    listOperations(),
  ]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/units/${unit.id}`}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>
      <h1 className="mt-6 text-2xl font-semibold">Editar unidade</h1>
      <section className="mt-8 rounded-lg border bg-card p-6">
        <UnitForm operations={operations} unit={unit} />
      </section>
    </main>
  );
}
