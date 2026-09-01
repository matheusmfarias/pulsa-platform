import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/modules/authorization";
import {
  listPositions,
  PositionStatusAction,
  PositionStatusBadge,
} from "@/modules/positions";
import {
  getUnitById,
  UnitStatusAction,
  UnitStatusBadge,
  unitIdSchema,
} from "@/modules/units";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

export default async function UnitDetailsPage({
  params,
}: PageProps<"/app/units/[unitId]">) {
  const route = unitIdSchema.safeParse((await params).unitId);
  if (!route.success) notFound();
  let unit;
  let positions;
  try {
    [unit, positions] = await Promise.all([
      getUnitById(route.data),
      listPositions({ unitId: route.data }),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-destructive">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/units">
          <ArrowLeft className="size-4" />
          Voltar para unidades
        </Link>
      </Button>
      <div className="mt-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{unit.name}</h1>
            <UnitStatusBadge status={unit.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Operação:{" "}
            <Link
              href={`/app/operations/${unit.operation.id}`}
              className="font-medium text-foreground hover:underline"
            >
              {unit.operation.name}
            </Link>
          </p>
        </div>
        <PermissionGate permission="unit:update">
          <Button asChild variant="outline">
            <Link href={`/app/units/${unit.id}/edit`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        </PermissionGate>
      </div>
      <section className="mt-8 rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Dados da unidade</h2>
        </div>
        <dl className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Código</dt>
            <dd className="mt-2 text-sm">{unit.code ?? "Não informado"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">
              Timezone
            </dt>
            <dd className="mt-2 text-sm">{unit.timezone}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">
              Endereço
            </dt>
            <dd className="mt-2 text-sm">{unit.address ?? "Não informado"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">
              Cidade / Estado
            </dt>
            <dd className="mt-2 text-sm">
              {[unit.city, unit.state].filter(Boolean).join(" / ") ||
                "Não informado"}
            </dd>
          </div>
        </dl>
      </section>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Status da unidade</h2>
        <div className="mt-4">
          <PermissionGate permission="unit:update">
            <UnitStatusAction unitId={unit.id} currentStatus={unit.status} />
          </PermissionGate>
        </div>
      </section>
      <section className="mt-6 rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-semibold">Postos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Postos operacionais desta unidade.
            </p>
          </div>
          {unit.status === "active" ? (
            <PermissionGate permission="position:create">
              <Button asChild size="sm">
                <Link href={`/app/units/${unit.id}/positions/new`}>
                  <Plus className="size-4" />
                  Novo posto
                </Link>
              </Button>
            </PermissionGate>
          ) : null}
        </div>
        {positions.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Nenhum posto cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Cargo</th>
                  <th className="px-6 py-3">Efetivo base</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {positions.map((position) => (
                  <tr key={position.id}>
                    <td className="px-6 py-4 font-medium">
                      <Link className="hover:underline" href={`/app/units/${unit.id}/positions/${position.id}`}>
                        {position.job_role.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 tabular-nums">
                      {position.base_required_headcount}
                    </td>
                    <td className="px-6 py-4">
                      <PositionStatusBadge status={position.status} />
                    </td>
                    <td className="flex gap-2 px-6 py-4">
                      <PermissionGate permission="position:update">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/app/units/${unit.id}/positions/${position.id}/edit`}
                          >
                            Editar
                          </Link>
                        </Button>
                        <PositionStatusAction
                          positionId={position.id}
                          currentStatus={position.status}
                        />
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
