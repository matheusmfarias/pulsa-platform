import { createServerSupabaseClient } from "@/shared/db/supabase";

import type { WorkerStatus } from "../domain/worker";
import type { WorkerInput, WorkerListFilters } from "../schemas/worker-schemas";

function sanitizeSearchTerm(value: string): string {
  return value.replace(/[%_*,().-]/g, " ").replace(/\s+/g, " ").trim();
}

export async function findWorkers(
  organizationId: string,
  filters: WorkerListFilters,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("workers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("full_name", { ascending: true });

  if (filters.status !== "all") query = query.eq("status", filters.status);
  const term = sanitizeSearchTerm(filters.query);
  if (term) {
    const digits = term.replace(/\D/g, "");
    const clauses = [`full_name.ilike.%${term}%`];
    if (digits) clauses.push(`document_number.ilike.%${digits}%`);
    query = query.or(clauses.join(","));
  }
  return query;
}

export async function findWorkerById(
  organizationId: string,
  workerId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("workers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", workerId)
    .maybeSingle();
}

export async function insertWorker(
  organizationId: string,
  input: WorkerInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_worker_with_audit", {
    operation: "create",
    organization_id: organizationId,
    full_name: input.full_name,
    document_number: input.document_number,
    email: input.email ?? undefined,
    phone: input.phone ?? undefined,
    engagement_start_date: input.engagement_start_date ?? undefined,
    engagement_end_date: input.engagement_end_date ?? undefined,
  });
}

export async function updateWorkerRecord(
  organizationId: string,
  workerId: string,
  input: WorkerInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_worker_with_audit", {
    operation: "update",
    entity_id: workerId,
    organization_id: organizationId,
    full_name: input.full_name,
    document_number: input.document_number,
    email: input.email ?? undefined,
    phone: input.phone ?? undefined,
    engagement_start_date: input.engagement_start_date ?? undefined,
    engagement_end_date: input.engagement_end_date ?? undefined,
  });
}

export async function updateWorkerStatus(
  organizationId: string,
  workerId: string,
  currentStatus: WorkerStatus,
  targetStatus: WorkerStatus,
) {
  const supabase = await createServerSupabaseClient();
  void currentStatus;
  return supabase.rpc("mutate_worker_with_audit", {
    operation: "status_change",
    entity_id: workerId,
    organization_id: organizationId,
    target_status: targetStatus,
  });
}
