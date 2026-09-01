import { createServerSupabaseClient } from "@/shared/db/supabase";

import type { JobRoleStatus } from "../domain/job-role";
import type {
  JobRoleInput,
  JobRoleListFilters,
} from "../schemas/job-role-schemas";

function sanitizeSearchTerm(value: string): string {
  return value.replace(/[%_*,().]/g, " ").replace(/\s+/g, " ").trim();
}

export async function findJobRoles(
  organizationId: string,
  filters: JobRoleListFilters,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("job_roles")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });
  if (filters.status !== "all") query = query.eq("status", filters.status);
  const searchTerm = sanitizeSearchTerm(filters.query);
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`);
  return query;
}

export async function findJobRoleById(
  organizationId: string,
  jobRoleId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("job_roles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", jobRoleId)
    .maybeSingle();
}

export async function insertJobRole(
  organizationId: string,
  input: JobRoleInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_job_role_with_audit", {
    operation: "create",
    organization_id: organizationId,
    name: input.name,
    description: input.description ?? undefined,
  });
}

export async function updateJobRoleRecord(
  jobRoleId: string,
  input: JobRoleInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_job_role_with_audit", {
    operation: "update",
    entity_id: jobRoleId,
    name: input.name,
    description: input.description ?? undefined,
  });
}

export async function updateJobRoleStatus(
  jobRoleId: string,
  targetStatus: JobRoleStatus,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_job_role_with_audit", {
    operation: "status_change",
    entity_id: jobRoleId,
    target_status: targetStatus,
  });
}
