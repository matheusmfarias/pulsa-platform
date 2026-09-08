import { createServerSupabaseClient } from "@/shared/db/supabase";

export async function insertReplacement(
  organizationId: string,
  absenceId: string,
  assignmentId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("create_replacement", {
    organization_id: organizationId,
    absence_id: absenceId,
    assignment_id: assignmentId,
  });
}

export async function cancelReplacementRecord(
  organizationId: string,
  replacementId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("cancel_replacement", {
    organization_id: organizationId,
    replacement_id: replacementId,
  });
}

export async function findReplacementCandidates(
  organizationId: string,
  absenceId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("list_replacement_candidates", {
    organization_id: organizationId,
    absence_id: absenceId,
  });
}
