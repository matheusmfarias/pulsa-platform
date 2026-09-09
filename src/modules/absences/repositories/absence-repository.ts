import { createServerSupabaseClient } from "@/shared/db/supabase";
import {
  applyOperationalContextFilter,
  OPERATIONAL_CONTEXT_QUERY_PATHS,
  type OperationalContext,
} from "@/modules/operational-context";

import type { CreateAbsenceInput } from "../schemas/absence-schemas";

const ABSENCE_WITH_CONTEXT_SELECT =
  "*, reporter:profiles!absences_reported_by_fkey(id, display_name), replacements(id, status, replacement_assignment_id, replacement_assignment:assignments!replacements_replacement_assignment_id_fkey(worker:workers!inner(id, full_name), position:positions!inner(job_role:job_roles!inner(id, name), unit:units!inner(id, name)))), schedule_entry:schedule_entries!inner(*, assignment:assignments!inner(id, worker:workers!inner(id, full_name), position:positions!inner(id, job_role:job_roles!inner(id, name), unit:units!inner(id, name, timezone, operation:operations!inner(id, name, contract_id)))), schedule_revision:schedule_revisions!inner(id, schedule:schedules!inner(id, operation:operations!inner(id, contract_id, contract:contracts!inner(id, client_id)))))";

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
    const { data: selected, error: selectionError } = await supabase.rpc(
      "list_uncovered_absence_ids",
      {
        organization_id: organizationId,
        client_id:
          operationalContext.type === "all"
            ? undefined
            : operationalContext.clientId,
        contract_id:
          operationalContext.type === "contract"
            ? operationalContext.contractId
            : undefined,
        result_limit: options.limit,
      },
    );
    if (selectionError) return { data: null, error: selectionError };
    const ids = (selected ?? []).map((item) => item.absence_id);
    if (ids.length === 0) return { data: [], error: null };

    const hydratedQuery = applyOperationalContextFilter(
      supabase
        .from("absences")
        .select(ABSENCE_WITH_CONTEXT_SELECT)
        .eq("organization_id", organizationId)
        .in("id", ids),
      operationalContext,
      OPERATIONAL_CONTEXT_QUERY_PATHS.absences,
    );
    const result = await hydratedQuery;
    const order = new Map(ids.map((id, index) => [id, index]));
    return {
      ...result,
      data: result.data
        ? [...result.data].sort(
            (left, right) =>
              (order.get((left as { id: string }).id) ?? 0) -
              (order.get((right as { id: string }).id) ?? 0),
          )
        : result.data,
    };
  }

  const query = supabase
    .from("absences")
    .select(ABSENCE_WITH_CONTEXT_SELECT)
    .eq("organization_id", organizationId)
    .order("reported_at", { ascending: false });
  const filteredQuery = applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.absences,
  );
  return options.limit ? filteredQuery.limit(options.limit) : filteredQuery;
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
