import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";
import { parseUnitWithContext, type UnitWithContext } from "../domain/unit";
import { findUnitById } from "../repositories/unit-repository";
import { throwUnitRepositoryError } from "./repository-errors";

export async function getUnitById(unitId: string): Promise<UnitWithContext> {
  await requirePermission("unit:read");
  const { data, error } = await findUnitById(unitId);
  if (error) throwUnitRepositoryError(error, "get_unit");
  if (!data) throw new AppError("NOT_FOUND", "Unidade não encontrada.");
  return parseUnitWithContext(data);
}
