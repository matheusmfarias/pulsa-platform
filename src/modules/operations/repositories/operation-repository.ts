import { createServerSupabaseClient } from "@/shared/db/supabase";

import type { OperationStatus } from "../domain/operation";
import type {
  OperationInput,
  OperationListFilters,
} from "../schemas/operation-schemas";

const OPERATION_WITH_CONTEXT_SELECT =
  "*, contract:contracts!inner(id, name, status, client:clients!inner(id, trade_name, status, organization_id))";

export async function findOperations(filters: OperationListFilters) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("operations")
    .select(OPERATION_WITH_CONTEXT_SELECT)
    .order("start_date", { ascending: false })
    .order("name", { ascending: true });

  if (filters.contractId) query = query.eq("contract_id", filters.contractId);
  if (filters.status) query = query.eq("status", filters.status);

  return query;
}

export async function findOperationById(operationId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("operations")
    .select(OPERATION_WITH_CONTEXT_SELECT)
    .eq("id", operationId)
    .maybeSingle();
}

export async function findActiveManagerMembership(
  organizationId: string,
  profileId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("organization_members")
    .select("profile_id")
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId)
    .eq("status", "active")
    .maybeSingle();
}

export async function insertOperation(input: OperationInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_operation_with_audit", {
    operation: "create",
    contract_id: input.contract_id,
    name: input.name,
    start_date: input.start_date,
    ...(input.description ? { description: input.description } : {}),
    ...(input.end_date ? { end_date: input.end_date } : {}),
    ...(input.manager_user_id
      ? { manager_user_id: input.manager_user_id }
      : {}),
  });
}

export async function updateOperationRecord(
  operationId: string,
  input: OperationInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_operation_with_audit", {
    operation: "update",
    entity_id: operationId,
    contract_id: input.contract_id,
    name: input.name,
    start_date: input.start_date,
    ...(input.description ? { description: input.description } : {}),
    ...(input.end_date ? { end_date: input.end_date } : {}),
    ...(input.manager_user_id
      ? { manager_user_id: input.manager_user_id }
      : {}),
  });
}

export async function updateOperationStatus(
  operationId: string,
  currentStatus: OperationStatus,
  targetStatus: OperationStatus,
) {
  const supabase = await createServerSupabaseClient();
  void currentStatus;
  return supabase.rpc("mutate_operation_with_audit", {
    operation: "status_change",
    entity_id: operationId,
    target_status: targetStatus,
  });
}
