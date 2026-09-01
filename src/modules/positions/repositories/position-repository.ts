import { createServerSupabaseClient } from "@/shared/db/supabase";
import type { PositionStatus } from "../domain/position";
import type {
  PositionInput,
  PositionGlobalListFilters,
  PositionListFilters,
} from "../schemas/position-schemas";

const SELECT =
  "*, job_role:job_roles!inner(id, name, status), unit:units!inner(id, name, status, operation:operations!inner(id, name))";
const GLOBAL_LIST_SELECT =
  "*, job_role:job_roles!inner(id, name), unit:units!inner(id, name, operation:operations!inner(id, name, contract:contracts!inner(id, client:clients!inner(id, trade_name)))), assignments(status)";
export async function findPositions(filters: PositionListFilters) {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("positions").select(SELECT).order("created_at");
  if (filters.unitId) query = query.eq("unit_id", filters.unitId);
  if (filters.status) query = query.eq("status", filters.status);
  return query;
}
export async function findPositionsForGlobalList(
  filters: PositionGlobalListFilters,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("positions")
    .select(GLOBAL_LIST_SELECT)
    .order("created_at");
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.query) query = query.ilike("job_role.name", `%${filters.query}%`);
  return query;
}
export async function findPositionById(id: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.from("positions").select(SELECT).eq("id", id).maybeSingle();
}
export async function insertPosition(input: PositionInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_position_with_audit", {
    operation: "create",
    unit_id: input.unit_id,
    job_role_id: input.job_role_id,
    description: input.description ?? undefined,
    base_required_headcount: input.base_required_headcount,
  });
}
export async function updatePositionRecord(id: string, input: PositionInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_position_with_audit", {
    operation: "update",
    entity_id: id,
    unit_id: input.unit_id,
    job_role_id: input.job_role_id,
    description: input.description ?? undefined,
    base_required_headcount: input.base_required_headcount,
  });
}
export async function updatePositionStatus(
  id: string,
  current: PositionStatus,
  target: PositionStatus,
) {
  const supabase = await createServerSupabaseClient();
  void current;
  return supabase.rpc("mutate_position_with_audit", {
    operation: "status_change",
    entity_id: id,
    target_status: target,
  });
}
