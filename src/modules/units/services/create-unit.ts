import { getOperationById } from "@/modules/operations";
import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";
import { parseUnit, type Unit } from "../domain/unit";
import { insertUnit } from "../repositories/unit-repository";
import type { UnitInput } from "../schemas/unit-schemas";
import { throwUnitRepositoryError } from "./repository-errors";

export async function createUnit(input: UnitInput): Promise<Unit> {
  await requirePermission("unit:create");
  const operation = await getOperationById(input.operation_id);
  if (operation.status === "closed") {
    throw new AppError(
      "CONFLICT",
      "Não é possível criar unidade em uma operação encerrada.",
    );
  }
  const { data, error } = await insertUnit(input);
  if (error) throwUnitRepositoryError(error, "create_unit");
  return parseUnit(data);
}
