import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";
import { parseUnitWithContext, type UnitWithContext } from "../domain/unit";
import { findUnits } from "../repositories/unit-repository";
import type { UnitListFilters } from "../schemas/unit-schemas";
import { throwUnitRepositoryError } from "./repository-errors";

export async function listUnits(
  filters: UnitListFilters = {},
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<UnitWithContext[]> {
  await requirePermission("unit:read");
  const { data, error } = await findUnits(filters, operationalContext);
  if (error) throwUnitRepositoryError(error, "list_units");
  return data.map(parseUnitWithContext);
}
