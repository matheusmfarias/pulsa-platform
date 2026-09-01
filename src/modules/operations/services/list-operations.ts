import { requirePermission } from "@/modules/authorization";

import {
  parseOperationWithContext,
  type OperationWithContext,
} from "../domain/operation";
import { findOperations } from "../repositories/operation-repository";
import type { OperationListFilters } from "../schemas/operation-schemas";
import { throwOperationRepositoryError } from "./repository-errors";

export async function listOperations(
  filters: OperationListFilters = {},
): Promise<OperationWithContext[]> {
  await requirePermission("operation:read");
  const { data, error } = await findOperations(filters);

  if (error) {
    throwOperationRepositoryError(error, "list_operations");
  }

  return data.map(parseOperationWithContext);
}
