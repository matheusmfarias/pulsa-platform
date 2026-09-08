import { createServerSupabaseClient } from "@/shared/db/supabase";
import {
  applyOperationalContextFilter,
  OPERATIONAL_CONTEXT_QUERY_PATHS,
  type OperationalContext,
} from "@/modules/operational-context";

import type { AssignmentInput, AssignmentListFilters } from "../schemas/assignment-schemas";

const ASSIGNMENT_WITH_CONTEXT_SELECT =
  "*, worker:workers!inner(id, full_name, status, organization_id), position:positions!inner(id, status, job_role:job_roles!inner(id, name), unit:units!inner(id, name, timezone, operation:operations!inner(id, name, contract:contracts!inner(id, name, client:clients!inner(id, trade_name, organization_id)))))";

export async function findAssignments(
  filters: AssignmentListFilters,
  operationalContext: OperationalContext,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("assignments")
    .select(ASSIGNMENT_WITH_CONTEXT_SELECT)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (filters.workerId) query = query.eq("worker_id", filters.workerId);
  if (filters.positionId) query = query.eq("position_id", filters.positionId);
  if (filters.status) query = query.eq("status", filters.status);
  return applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.assignments,
  );
}

export async function findAssignmentsForOperation(operationId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("assignments")
    .select(ASSIGNMENT_WITH_CONTEXT_SELECT)
    .eq("position.unit.operation_id", operationId)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function findAssignmentsForUnit(unitId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("assignments")
    .select(ASSIGNMENT_WITH_CONTEXT_SELECT)
    .eq("position.unit_id", unitId)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function findActiveAssignmentsWithContext(
  operationalContext: OperationalContext,
) {
  const supabase = await createServerSupabaseClient();
  const query = supabase
    .from("assignments")
    .select(ASSIGNMENT_WITH_CONTEXT_SELECT)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });
  return applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.assignments,
  );
}

export async function findAssignmentById(assignmentId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("assignments")
    .select(ASSIGNMENT_WITH_CONTEXT_SELECT)
    .eq("id", assignmentId)
    .maybeSingle();
}

export async function findAssignmentParents(workerId: string, positionId: string) {
  const supabase = await createServerSupabaseClient();
  const [worker, position] = await Promise.all([
    supabase
      .from("workers")
      .select("id, status, organization_id")
      .eq("id", workerId)
      .maybeSingle(),
    supabase
      .from("positions")
      .select(
        "id, status, unit:units!inner(operation:operations!inner(contract:contracts!inner(client:clients!inner(organization_id))))",
      )
      .eq("id", positionId)
      .maybeSingle(),
  ]);
  return { worker, position };
}

export async function insertAssignment(input: AssignmentInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_assignment_with_audit", {
    operation: "create",
    worker_id: input.worker_id,
    position_id: input.position_id,
    start_date: input.start_date,
    ...(input.end_date ? { end_date: input.end_date } : {}),
  });
}

export async function updateAssignmentRecord(
  assignmentId: string,
  input: AssignmentInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_assignment_with_audit", {
    operation: "update",
    entity_id: assignmentId,
    worker_id: input.worker_id,
    position_id: input.position_id,
    start_date: input.start_date,
    ...(input.end_date ? { end_date: input.end_date } : {}),
  });
}

export async function updateAssignmentStatus(
  assignmentId: string,
  targetStatus: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_assignment_with_audit", {
    operation: "status_change",
    entity_id: assignmentId,
    target_status: targetStatus,
  });
}
