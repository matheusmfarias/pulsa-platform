import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";

import {
  parsePositionGlobalListItem,
  type PositionGlobalListItem,
} from "../domain/position";
import { findPositionsForGlobalList } from "../repositories/position-repository";
import { positionGlobalListFiltersSchema } from "../schemas/position-schemas";
import { throwPositionRepositoryError } from "./repository-errors";

export async function listPositionsForGlobalView(
  filters: unknown = {},
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<PositionGlobalListItem[]> {
  await requirePermission("position:read");
  const parsed = positionGlobalListFiltersSchema.parse(filters);
  const { data, error } = await findPositionsForGlobalList(
    parsed,
    operationalContext,
  );
  if (error) throwPositionRepositoryError(error, "list_global");
  return (data ?? []).map(parsePositionGlobalListItem);
}
