import { getClientById } from "@/modules/clients";
import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseContract, type Contract } from "../domain/contract";
import { updateContractRecord } from "../repositories/contract-repository";
import type { ContractInput } from "../schemas/contract-schemas";
import { getContractById } from "./get-contract-by-id";
import { throwContractRepositoryError } from "./repository-errors";

export async function updateContract(
  contractId: string,
  input: ContractInput,
): Promise<Contract> {
  await requirePermission("contract:update");
  const currentContract = await getContractById(contractId);
  const targetClient = await getClientById(input.client_id);

  if (
    currentContract.client_id !== targetClient.id &&
    targetClient.status !== "active"
  ) {
    throw new AppError(
      "CONFLICT",
      "Não é possível transferir o contrato para um cliente inativo.",
    );
  }

  const { data, error } = await updateContractRecord(contractId, input);

  if (error) {
    throwContractRepositoryError(error, "update_contract");
  }

  if (!data) {
    throw new AppError("NOT_FOUND", "Contrato não encontrado.");
  }

  return parseContract(data);
}
