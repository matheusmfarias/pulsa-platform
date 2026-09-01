import { createServerSupabaseClient } from "@/shared/db/supabase";

export type ActivePositionOverviewItem = {
  base_required_headcount: number;
  id: string;
  unit: { operation: { id: string } };
};

export type ActiveAssignmentOverviewItem = {
  position_id: string;
  worker_id: string;
};

export async function findActivePositionOverviewItems() {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("positions")
    .select(
      "id, base_required_headcount, unit:units!inner(operation:operations!inner(id))",
    )
    .eq("status", "active");
}

export async function findActiveAssignmentOverviewItems() {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("assignments")
    .select("worker_id, position_id")
    .eq("status", "active");
}
