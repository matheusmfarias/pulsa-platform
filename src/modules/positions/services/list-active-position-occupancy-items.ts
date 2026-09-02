import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";

import { findActivePositionOccupancyItems } from "../repositories/position-repository";
import { throwPositionRepositoryError } from "./repository-errors";

export type ActivePositionOccupancyItem = {
  assignments: Array<{ status: string }>;
  base_required_headcount: number;
  id: string;
  unit_id: string;
};

export async function listActivePositionOccupancyItems(
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<
  ActivePositionOccupancyItem[]
> {
  await Promise.all([
    requirePermission("position:read"),
    requirePermission("assignment:read"),
  ]);
  const { data, error } = await findActivePositionOccupancyItems(
    operationalContext,
  );
  if (error) throwPositionRepositoryError(error, "list_active_occupancy");
  return (data ?? []) as ActivePositionOccupancyItem[];
}
