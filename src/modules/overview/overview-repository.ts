import { createServerSupabaseClient } from "@/shared/db/supabase";
import {
  applyOperationalContextFilter,
  OPERATIONAL_CONTEXT_QUERY_PATHS,
  type OperationalContext,
} from "@/modules/operational-context";

export type ActivePositionOverviewItem = {
  base_required_headcount: number;
  id: string;
  unit: { operation: { id: string } };
};

export type ActiveAssignmentOverviewItem = {
  position_id: string;
  worker_id: string;
};

export async function findActivePositionOverviewItems(
  operationalContext: OperationalContext,
) {
  const supabase = await createServerSupabaseClient();
  const query = supabase
    .from("positions")
    .select(
      "id, base_required_headcount, unit:units!inner(operation:operations!inner(id, contract:contracts!inner(id, client_id)))",
    )
    .eq("status", "active");
  return applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.positions,
  );
}

export async function findActiveAssignmentOverviewItems(
  operationalContext: OperationalContext,
) {
  const supabase = await createServerSupabaseClient();
  const query = supabase
    .from("assignments")
    .select("worker_id, position_id, position:positions!inner(unit:units!inner(operation:operations!inner(contract:contracts!inner(id, client_id))))")
    .eq("status", "active");
  return applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.assignments,
  );
}
