import { createServerSupabaseClient } from "@/shared/db/supabase";
import {
  applyOperationalContextFilter,
  OPERATIONAL_CONTEXT_QUERY_PATHS,
  type OperationalContext,
} from "@/modules/operational-context";

import type { UnitStatus } from "../domain/unit";
import type { UnitInput, UnitListFilters } from "../schemas/unit-schemas";

const UNIT_WITH_CONTEXT_SELECT =
  "*, operation:operations!inner(id, name, status, contract:contracts!inner(id, name, client:clients!inner(id, trade_name, organization_id)))";

export async function findUnits(
  filters: UnitListFilters,
  operationalContext: OperationalContext,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("units")
    .select(UNIT_WITH_CONTEXT_SELECT)
    .order("name", { ascending: true });
  if (filters.operationId)
    query = query.eq("operation_id", filters.operationId);
  if (filters.status) query = query.eq("status", filters.status);
  return applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.units,
  );
}

export async function findUnitById(unitId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("units")
    .select(UNIT_WITH_CONTEXT_SELECT)
    .eq("id", unitId)
    .maybeSingle();
}

export async function insertUnit(input: UnitInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_unit_with_audit", {
    operation: "create",
    operation_id: input.operation_id,
    name: input.name,
    code: input.code ?? undefined,
    address: input.address ?? undefined,
    city: input.city ?? undefined,
    state: input.state ?? undefined,
    timezone: input.timezone,
  });
}

export async function updateUnitRecord(unitId: string, input: UnitInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_unit_with_audit", {
    operation: "update",
    entity_id: unitId,
    operation_id: input.operation_id,
    name: input.name,
    code: input.code ?? undefined,
    address: input.address ?? undefined,
    city: input.city ?? undefined,
    state: input.state ?? undefined,
    timezone: input.timezone,
  });
}

export async function updateUnitStatus(
  unitId: string,
  currentStatus: UnitStatus,
  targetStatus: UnitStatus,
) {
  const supabase = await createServerSupabaseClient();
  void currentStatus;
  return supabase.rpc("mutate_unit_with_audit", {
    operation: "status_change",
    entity_id: unitId,
    target_status: targetStatus,
  });
}
