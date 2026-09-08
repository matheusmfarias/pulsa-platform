import { createServerSupabaseClient } from "@/shared/db/supabase";

import type {
  CancelPresenceInput,
  CompletePresenceInput,
  CorrectPresenceInput,
  StartPresenceInput,
} from "../schemas/presence-schemas";

export async function startPresenceRecord(
  organizationId: string,
  input: StartPresenceInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("start_presence", {
    organization_id: organizationId,
    schedule_entry_id: input.schedule_entry_id,
    arrived_at: input.arrived_at,
    idempotency_key: input.idempotency_key,
    source: input.source,
    source_reference: input.source_reference,
  });
}

export async function completePresenceRecord(
  organizationId: string,
  input: CompletePresenceInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("complete_presence", {
    organization_id: organizationId,
    presence_id: input.presence_id,
    departed_at: input.departed_at,
    idempotency_key: input.idempotency_key,
    source: input.source,
    source_reference: input.source_reference,
  });
}

export async function correctPresenceRecord(
  organizationId: string,
  input: CorrectPresenceInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("correct_presence", {
    organization_id: organizationId,
    presence_id: input.presence_id,
    arrived_at: input.arrived_at,
    departed_at: input.departed_at,
    reason: input.reason,
    idempotency_key: input.idempotency_key,
    source: input.source,
    source_reference: input.source_reference,
  });
}

export async function cancelPresenceRecord(
  organizationId: string,
  input: CancelPresenceInput,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("cancel_presence", {
    organization_id: organizationId,
    presence_id: input.presence_id,
    reason: input.reason,
    idempotency_key: input.idempotency_key,
    source: input.source,
    source_reference: input.source_reference,
  });
}

export async function findPresenceById(
  organizationId: string,
  presenceId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("presences")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", presenceId)
    .maybeSingle();
}

export async function findPresences(organizationId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("presences")
    .select("*")
    .eq("organization_id", organizationId)
    .order("arrived_at", { ascending: false });
}

