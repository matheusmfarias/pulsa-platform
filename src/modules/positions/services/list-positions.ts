import {
  parsePositionWithContext,
  type PositionWithContext,
} from "../domain/position";
import { findPositions } from "../repositories/position-repository";
import { positionListFiltersSchema } from "../schemas/position-schemas";
import { throwPositionRepositoryError } from "./repository-errors";
export async function listPositions(
  filters: unknown = {},
): Promise<PositionWithContext[]> {
  await requirePermission("position:read");
  const parsed = positionListFiltersSchema.parse(filters);
  const { data, error } = await findPositions(parsed);
  if (error) throwPositionRepositoryError(error, "list");
  return (data ?? []).map(parsePositionWithContext);
}
import { requirePermission } from "@/modules/authorization";
