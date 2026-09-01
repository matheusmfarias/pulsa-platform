import { requirePermission } from "@/modules/authorization";

import {
  parseContractWithClient,
  type ContractWithClient,
} from "../domain/contract";
import { findContracts } from "../repositories/contract-repository";
import type { ContractListFilters } from "../schemas/contract-schemas";
import { throwContractRepositoryError } from "./repository-errors";

export async function listContracts(
  filters: ContractListFilters = {},
): Promise<ContractWithClient[]> {
  const { organizationId } = await requirePermission("contract:read");
  const { data, error } = await findContracts(organizationId, filters);

  if (error) {
    throwContractRepositoryError(error, "list_contracts");
  }

  return data.map(parseContractWithClient);
}
