import { getOperationById } from "@/modules/operations";
import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";
import { parseUnit, type Unit } from "../domain/unit";
import { updateUnitRecord } from "../repositories/unit-repository";
import type { UnitInput } from "../schemas/unit-schemas";
import { getUnitById } from "./get-unit-by-id";
import { throwUnitRepositoryError } from "./repository-errors";

export async function updateUnit(
  unitId: string,
  input: UnitInput,
): Promise<Unit> {
  await requirePermission("unit:update");
  const currentUnit = await getUnitById(unitId);
  const targetOperation = await getOperationById(input.operation_id);
  if (
    currentUnit.operation_id !== targetOperation.id &&
    targetOperation.status === "closed"
  ) {
    throw new AppError(
      "CONFLICT",
      "Não é possível transferir a unidade para uma operação encerrada.",
    );
  }
  const { data, error } = await updateUnitRecord(unitId, input);
  if (error) throwUnitRepositoryError(error, "update_unit");
  if (!data) throw new AppError("NOT_FOUND", "Unidade não encontrada.");
  return parseUnit(data);
}
