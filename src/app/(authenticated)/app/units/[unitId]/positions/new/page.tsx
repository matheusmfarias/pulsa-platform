import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { listJobRoles } from "@/modules/job-roles";
import { PositionForm } from "@/modules/positions";
import { getUnitById, unitIdSchema } from "@/modules/units";
export default async function NewPositionPage({
  params,
}: PageProps<"/app/units/[unitId]/positions/new">) {
  const route = unitIdSchema.safeParse((await params).unitId);
  if (!route.success) notFound();
  const [unit, jobRoles] = await Promise.all([
    getUnitById(route.data),
    listJobRoles({ status: "active" }),
  ]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/units/${unit.id}`}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>
      <h1 className="mt-6 text-2xl font-semibold">Novo posto</h1>
      <p className="mt-2 text-sm text-muted-foreground">Unidade: {unit.name}</p>
      {unit.status !== "active" ? (
        <p className="mt-8 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Ative a unidade antes de cadastrar um posto.
        </p>
      ) : (
        <section className="mt-8 rounded-lg border bg-card p-6">
          <PositionForm unitId={unit.id} jobRoles={jobRoles} />
        </section>
      )}
    </main>
  );
}
