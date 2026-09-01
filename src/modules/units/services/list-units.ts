import { requirePermission } from "@/modules/authorization";
import { parseUnitWithContext, type UnitWithContext } from "../domain/unit";
import { findUnits } from "../repositories/unit-repository";
import type { UnitListFilters } from "../schemas/unit-schemas";
import { throwUnitRepositoryError } from "./repository-errors";

export async function listUnits(
  filters: UnitListFilters = {},
): Promise<UnitWithContext[]> {
  await requirePermission("unit:read");
  const { data, error } = await findUnits(filters);
  if (error) throwUnitRepositoryError(error, "list_units");
  return data.map(parseUnitWithContext);
}
