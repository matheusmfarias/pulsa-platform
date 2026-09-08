import { createServerSupabaseClient } from "@/shared/db/supabase";
import {
  applyOperationalContextFilter,
  OPERATIONAL_CONTEXT_QUERY_PATHS,
  type OperationalContext,
} from "@/modules/operational-context";

import type { CreateAbsenceInput } from "../schemas/absence-schemas";

const ABSENCE_WITH_CONTEXT_SELECT =
  "*, reporter:profiles!absences_reported_by_fkey(id, display_name), replacements(id, status, replacement_assignment_id, replacement_assignment:assignments!replacements_replacement_assignment_id_fkey(worker:workers!inner(id, full_name), position:positions!inner(job_role:job_roles!inner(id, name), unit:units!inner(id, name)))), schedule_entry:schedule_entries!inner(*, assignment:assignments!inner(id, worker:workers!inner(id, full_name), position:positions!inner(id, job_role:job_roles!inner(id, name), unit:units!inner(id, name, timezone, operation:operations!inner(id, name, contract_id)))), schedule_revision:schedule_revisions!inner(id, schedule:schedules!inner(id, operation:operations!inner(id, contract_id, contract:contracts!inner(id, client_id))))))";

export async function insertAbsence(
  organizationId: string,
  input: CreateAbsenceInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("create_absence", {
    organization_id: organizationId,
    schedule_entry_id: input.schedule_entry_id,
    reason: input.reason,
    notes: input.notes,
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
) {
  const supabase = await createServerSupabaseClient();
  const query = supabase
    .from("absences")
    .select(ABSENCE_WITH_CONTEXT_SELECT)
    .eq("organization_id", organizationId)
    .order("reported_at", { ascending: false });
  return applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.absences,
  );
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
