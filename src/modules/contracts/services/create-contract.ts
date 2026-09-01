import { getClientById } from "@/modules/clients";
import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseContract, type Contract } from "../domain/contract";
import { insertContract } from "../repositories/contract-repository";
import type { ContractInput } from "../schemas/contract-schemas";
import { throwContractRepositoryError } from "./repository-errors";

export async function createContract(input: ContractInput): Promise<Contract> {
  await requirePermission("contract:create");
  const client = await getClientById(input.client_id);

  if (client.status !== "active") {
    throw new AppError(
      "CONFLICT",
      "Não é possível criar contrato para um cliente inativo.",
    );
  }

  const { data, error } = await insertContract(input);

  if (error) {
    throwContractRepositoryError(error, "create_contract");
  }

  return parseContract(data);
}
