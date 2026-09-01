import { getContractById } from "@/modules/contracts";
import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseOperation, type Operation } from "../domain/operation";
import { updateOperationRecord } from "../repositories/operation-repository";
import type { OperationInput } from "../schemas/operation-schemas";
import { getOperationById } from "./get-operation-by-id";
import { throwOperationRepositoryError } from "./repository-errors";
import { validateOperationManager } from "./validate-manager";

export async function updateOperation(
  operationId: string,
  input: OperationInput,
): Promise<Operation> {
  const { organizationId } = await requirePermission("operation:update");
  const currentOperation = await getOperationById(operationId);
  const targetContract = await getContractById(input.contract_id);

  if (
    currentOperation.contract_id !== targetContract.id &&
    targetContract.status !== "active"
  ) {
    throw new AppError(
      "CONFLICT",
      "Não é possível transferir a operação para um contrato que não esteja ativo.",
    );
  }

  await validateOperationManager(organizationId, input.manager_user_id);
  const { data, error } = await updateOperationRecord(operationId, input);

  if (error) {
    throwOperationRepositoryError(error, "update_operation");
  }

  if (!data) {
    throw new AppError("NOT_FOUND", "Operação não encontrada.");
  }

  return parseOperation(data);
}
