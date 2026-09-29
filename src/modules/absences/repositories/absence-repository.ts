import { createServerSupabaseClient } from "@/shared/db/supabase";
import {
  applyOperationalContextFilter,
  OPERATIONAL_CONTEXT_QUERY_PATHS,
  type OperationalContext,
} from "@/modules/operational-context";

import type { CreateAbsenceInput } from "../schemas/absence-schemas";
import { measureServerStage } from "@/shared/logging";

const ABSENCE_WITH_CONTEXT_SELECT =
  "*, reporter:profiles!absences_reported_by_fkey(id, display_name), replacements(id, status, replacement_assignment_id, replacement_assignment:assignments!replacements_replacement_assignment_id_fkey(worker:workers!inner(id, full_name), position:positions!inner(job_role:job_roles!inner(id, name), unit:units!inner(id, name)))), schedule_entry:schedule_entries!absences_schedule_entry_id_fkey!inner(*, assignment:assignments!inner(id, worker:workers!inner(id, full_name), position:positions!inner(id, job_role:job_roles!inner(id, name), unit:units!inner(id, name, timezone, operation:operations!inner(id, name, contract_id)))), schedule_revision:schedule_revisions!inner(id, schedule:schedules!inner(id, operation:operations!inner(id, contract_id, contract:contracts!inner(id, client_id)))))";

const ABSENCE_LIST_SELECT =
  "id, reason, status, replacements(id, status, replacement_assignment:assignments!replacements_replacement_assignment_id_fkey(worker:workers!inner(full_name))), schedule_entry:schedule_entries!absences_schedule_entry_id_fkey!inner(starts_at, ends_at, assignment:assignments!inner(worker:workers!inner(full_name), position:positions!inner(job_role:job_roles!inner(name), unit:units!inner(name, timezone, operation:operations!inner(name)))), schedule_revision:schedule_revisions!inner(schedule:schedules!inner(operation:operations!inner(contract:contracts!inner(id, client_id)))))";

export async function insertAbsence(
  organizationId: string,
  input: CreateAbsenceInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("create_absence", {
    organization_id: organizationId,
    schedule_entry_id: input.schedule_entry_id,
    reason: input.reason,
    notes: input.notes ?? undefined,
  });
}

export async function cancelAbsenceRecord(
  organizationId: string,
  absenceId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("cancel_absence", {
    organization_id: organizationId,
    absence_id: absenceId,
  });
}

export async function findAbsenceById(
  organizationId: string,
  absenceId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("absences")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", absenceId)
    .maybeSingle();
}

export async function findAbsences(
  organizationId: string,
  operationalContext: OperationalContext,
  options: { withoutCoverage?: boolean; limit?: number } = {},
) {
  const supabase = await createServerSupabaseClient();
  if (options.withoutCoverage) {
    let uncoveredQuery = supabase
      .from("absences")
      .select(`${ABSENCE_LIST_SELECT}, active_replacements:replacements()`)
      .eq("organization_id", organizationId)
      .eq("status", "reported")
      .eq("active_replacements.status", "active")
      .is("active_replacements", null)
      .order("starts_at", { referencedTable: "schedule_entry", ascending: true })
      .order("id", { ascending: true });

    uncoveredQuery = applyOperationalContextFilter(
      uncoveredQuery,
      operationalContext,
      OPERATIONAL_CONTEXT_QUERY_PATHS.absences,
    );
    if (options.limit) uncoveredQuery = uncoveredQuery.limit(options.limit);

    return measureServerStage("absences.uncovered_list", () => uncoveredQuery);
  }

  const query = supabase
    .from("absences")
    .select(ABSENCE_LIST_SELECT)
    .eq("organization_id", organizationId)
    .order("reported_at", { ascending: false });
  const filteredQuery = applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.absences,
  );
  const limitedQuery = options.limit ? filteredQuery.limit(options.limit) : filteredQuery;
  return measureServerStage("absences.list", () => limitedQuery);
}

export async function findAbsenceDetailsById(
  organizationId: string,
  absenceId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("absences")
    .select(ABSENCE_WITH_CONTEXT_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", absenceId)
    .maybeSingle();
}
