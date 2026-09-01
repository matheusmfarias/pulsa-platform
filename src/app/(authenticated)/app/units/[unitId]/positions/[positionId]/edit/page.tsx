import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { listJobRoles } from "@/modules/job-roles";
import {
  getPositionById,
  PositionForm,
  positionIdSchema,
} from "@/modules/positions";
import { unitIdSchema } from "@/modules/units";
export default async function EditPositionPage({
  params,
}: PageProps<"/app/units/[unitId]/positions/[positionId]/edit">) {
  const values = await params;
  const route = unitIdSchema.safeParse(values.unitId);
  const id = positionIdSchema.safeParse(values.positionId);
  if (!route.success || !id.success) notFound();
  const [position, allJobRoles] = await Promise.all([
    getPositionById(id.data),
    listJobRoles(),
  ]);
  if (position.unit_id !== route.data) notFound();
  const jobRoles = allJobRoles.filter(
    (jobRole) => jobRole.status === "active" || jobRole.id === position.job_role_id,
  );
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/units/${route.data}`}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>
      <h1 className="mt-6 text-2xl font-semibold">Editar posto</h1>
      <section className="mt-8 rounded-lg border bg-card p-6">
        <PositionForm unitId={route.data} jobRoles={jobRoles} position={position} />
      </section>
    </main>
  );
}
