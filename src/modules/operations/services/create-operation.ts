import { getContractById } from "@/modules/contracts";
import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseOperation, type Operation } from "../domain/operation";
import { insertOperation } from "../repositories/operation-repository";
import type { OperationInput } from "../schemas/operation-schemas";
import { throwOperationRepositoryError } from "./repository-errors";
import { validateOperationManager } from "./validate-manager";

export async function createOperation(
  input: OperationInput,
): Promise<Operation> {
  const { organizationId } = await requirePermission("operation:create");
  const contract = await getContractById(input.contract_id);

  if (contract.status !== "active") {
    throw new AppError(
      "CONFLICT",
      "Não é possível criar operação para um contrato que não esteja ativo.",
    );
  }

  await validateOperationManager(organizationId, input.manager_user_id);
  const { data, error } = await insertOperation(input);

  if (error) {
    throwOperationRepositoryError(error, "create_operation");
  }

  return parseOperation(data);
}
