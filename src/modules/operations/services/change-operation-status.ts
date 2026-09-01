import { AppError } from "@/shared/errors";
import { requirePermission } from "@/modules/authorization";

import {
  canTransitionOperationStatus,
  parseOperation,
  type Operation,
  type OperationStatus,
} from "../domain/operation";
import { updateOperationStatus } from "../repositories/operation-repository";
import { getOperationById } from "./get-operation-by-id";
import { throwOperationRepositoryError } from "./repository-errors";

export async function changeOperationStatus(
  operationId: string,
  targetStatus: OperationStatus,
): Promise<Operation> {
  await requirePermission("operation:update");
  const currentOperation = await getOperationById(operationId);

  if (!canTransitionOperationStatus(currentOperation.status, targetStatus)) {
    throw new AppError(
      "CONFLICT",
      "Esta transição de status não é permitida para a operação.",
    );
  }

  const { data, error } = await updateOperationStatus(
    operationId,
    currentOperation.status,
    targetStatus,
  );

  if (error) {
    throwOperationRepositoryError(error, "change_operation_status");
  }

  if (!data) {
    throw new AppError(
      "CONFLICT",
      "O estado da operação mudou durante a operação. Atualize a página.",
    );
  }

  return parseOperation(data);
}
