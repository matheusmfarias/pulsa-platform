import { AppError } from "@/shared/errors";
import { requirePermission } from "@/modules/authorization";

import {
  canTransitionContractStatus,
  parseContract,
  type Contract,
  type ContractStatus,
} from "../domain/contract";
import { updateContractStatus } from "../repositories/contract-repository";
import { getContractById } from "./get-contract-by-id";
import { throwContractRepositoryError } from "./repository-errors";

export async function changeContractStatus(
  contractId: string,
  targetStatus: ContractStatus,
): Promise<Contract> {
  await requirePermission("contract:update");
  const currentContract = await getContractById(contractId);

  if (!canTransitionContractStatus(currentContract.status, targetStatus)) {
    throw new AppError(
      "CONFLICT",
      "Esta transição de status não é permitida para o contrato.",
    );
  }

  const { data, error } = await updateContractStatus(
    contractId,
    currentContract.status,
    targetStatus,
  );

  if (error) {
    throwContractRepositoryError(error, "change_contract_status");
  }

  if (!data) {
    throw new AppError(
      "CONFLICT",
      "O estado do contrato mudou durante a operação. Atualize a página.",
    );
  }

  return parseContract(data);
}
