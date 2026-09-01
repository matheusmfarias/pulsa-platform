import { createServerSupabaseClient } from "@/shared/db/supabase";

import type { ContractStatus } from "../domain/contract";
import type {
  ContractInput,
  ContractListFilters,
} from "../schemas/contract-schemas";

const CONTRACT_WITH_CLIENT_SELECT =
  "*, client:clients!inner(id, trade_name, status, organization_id)";

export async function findContracts(
  organizationId: string,
  filters: ContractListFilters,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("contracts")
    .select(CONTRACT_WITH_CLIENT_SELECT)
    .eq("clients.organization_id", organizationId)
    .order("start_date", { ascending: false })
    .order("name", { ascending: true });

  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.status) query = query.eq("status", filters.status);

  return query;
}

export async function findContractById(
  organizationId: string,
  contractId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("contracts")
    .select(CONTRACT_WITH_CLIENT_SELECT)
    .eq("clients.organization_id", organizationId)
    .eq("id", contractId)
    .maybeSingle();
}

export async function insertContract(input: ContractInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_contract_with_audit", {
    operation: "create",
    client_id: input.client_id,
    name: input.name,
    start_date: input.start_date,
    ...(input.end_date ? { end_date: input.end_date } : {}),
    ...(input.external_reference
      ? { external_reference: input.external_reference }
      : {}),
  });
}

export async function updateContractRecord(
  contractId: string,
  input: ContractInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_contract_with_audit", {
    operation: "update",
    entity_id: contractId,
    client_id: input.client_id,
    name: input.name,
    start_date: input.start_date,
    ...(input.end_date ? { end_date: input.end_date } : {}),
    ...(input.external_reference
      ? { external_reference: input.external_reference }
      : {}),
  });
}

export async function updateContractStatus(
  contractId: string,
  currentStatus: ContractStatus,
  targetStatus: ContractStatus,
) {
  const supabase = await createServerSupabaseClient();
  void currentStatus;
  return supabase.rpc("mutate_contract_with_audit", {
    operation: "status_change",
    entity_id: contractId,
    target_status: targetStatus,
  });
}
