import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import {
  parseContractWithClient,
  type ContractWithClient,
} from "../domain/contract";
import { findContractById } from "../repositories/contract-repository";
import { throwContractRepositoryError } from "./repository-errors";

export async function getContractById(
  contractId: string,
): Promise<ContractWithClient> {
  const { organizationId } = await requirePermission("contract:read");
  const { data, error } = await findContractById(organizationId, contractId);

  if (error) {
    throwContractRepositoryError(error, "get_contract");
  }

  if (!data) {
    throw new AppError("NOT_FOUND", "Contrato não encontrado.");
  }

  return parseContractWithClient(data);
}
