import { z } from "zod";

import { requirePermission } from "@/modules/authorization";

import { parsePositionWithContext, type PositionWithContext } from "../domain/position";
import { findPositionsForOperation } from "../repositories/position-repository";
import { throwPositionRepositoryError } from "./repository-errors";

export async function listPositionsForOperation(
  operationId: string,
): Promise<PositionWithContext[]> {
  await requirePermission("position:read");
  const { data, error } = await findPositionsForOperation(z.uuid().parse(operationId));
  if (error) throwPositionRepositoryError(error, "list_for_operation");
  return (data ?? []).map(parsePositionWithContext);
}
