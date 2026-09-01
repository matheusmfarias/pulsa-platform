import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import {
  parseOperationWithContext,
  type OperationWithContext,
} from "../domain/operation";
import { findOperationById } from "../repositories/operation-repository";
import { throwOperationRepositoryError } from "./repository-errors";

export async function getOperationById(
  operationId: string,
): Promise<OperationWithContext> {
  await requirePermission("operation:read");
  const { data, error } = await findOperationById(operationId);

  if (error) {
    throwOperationRepositoryError(error, "get_operation");
  }

  if (!data) {
    throw new AppError("NOT_FOUND", "Operação não encontrada.");
  }

  return parseOperationWithContext(data);
}
