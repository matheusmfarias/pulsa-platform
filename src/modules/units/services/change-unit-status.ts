import { AppError } from "@/shared/errors";
import { requirePermission } from "@/modules/authorization";
import { parseUnit, type Unit, type UnitStatus } from "../domain/unit";
import { updateUnitStatus } from "../repositories/unit-repository";
import { getUnitById } from "./get-unit-by-id";
import { throwUnitRepositoryError } from "./repository-errors";

export async function changeUnitStatus(
  unitId: string,
  targetStatus: UnitStatus,
): Promise<Unit> {
  await requirePermission("unit:update");
  const current = await getUnitById(unitId);
  if (current.status === targetStatus) {
    throw new AppError(
      "CONFLICT",
      targetStatus === "active"
        ? "A unidade já está ativa."
        : "A unidade já está inativa.",
    );
  }
  const { data, error } = await updateUnitStatus(
    unitId,
    current.status,
    targetStatus,
  );
  if (error) throwUnitRepositoryError(error, "change_unit_status");
  if (!data)
    throw new AppError(
      "CONFLICT",
      "O estado da unidade mudou. Atualize a página.",
    );
  return parseUnit(data);
}
