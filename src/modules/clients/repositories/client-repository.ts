import { createServerSupabaseClient } from "@/shared/db/supabase";

import type { ClientStatus } from "../domain/client";
import type { ClientInput, ClientListFilters } from "../schemas/client-schemas";

function sanitizeSearchTerm(value: string): string {
  return value.replace(/[%_*,().]/g, " ").replace(/\s+/g, " ").trim();
}

export async function findClients(
  organizationId: string,
  filters: ClientListFilters,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .order("trade_name", { ascending: true });

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const searchTerm = sanitizeSearchTerm(filters.query);
  if (searchTerm) {
    query = query.or(
      `legal_name.ilike.%${searchTerm}%,trade_name.ilike.%${searchTerm}%`,
    );
  }

  return query;
}

export async function findClientById(organizationId: string, clientId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .maybeSingle();
}

export async function insertClient(organizationId: string, input: ClientInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_client_with_audit", {
    operation: "create",
    organization_id: organizationId,
    ...input,
  });
}

export async function updateClientRecord(
  organizationId: string,
  clientId: string,
  input: ClientInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("mutate_client_with_audit", {
    operation: "update",
    entity_id: clientId,
    organization_id: organizationId,
    ...input,
  });
}

export async function updateClientStatus(
  organizationId: string,
  clientId: string,
  currentStatus: ClientStatus,
  targetStatus: ClientStatus,
) {
  const supabase = await createServerSupabaseClient();
  void currentStatus;
  return supabase.rpc("mutate_client_with_audit", {
    operation: "status_change",
    entity_id: clientId,
    organization_id: organizationId,
    target_status: targetStatus,
  });
}
