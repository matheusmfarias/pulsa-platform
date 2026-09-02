import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";

import {
  parseContractWithClient,
  type ContractWithClient,
} from "../domain/contract";
import { findContracts } from "../repositories/contract-repository";
import type { ContractListFilters } from "../schemas/contract-schemas";
import { throwContractRepositoryError } from "./repository-errors";

export async function listContracts(
  filters: ContractListFilters = {},
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<ContractWithClient[]> {
  const { organizationId } = await requirePermission("contract:read");
  const { data, error } = await findContracts(
    organizationId,
    filters,
    operationalContext,
  );

  if (error) {
    throwContractRepositoryError(error, "list_contracts");
  }

  return data.map(parseContractWithClient);
}
