import type { PostgrestError } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/shared/db/supabase";

export async function findWorkerPresenceAction(scheduleEntryId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("get_worker_presence_action", {
    schedule_entry_id: scheduleEntryId,
  });
}

export async function startWorkerPresenceRecord(input: {
  scheduleEntryId: string;
  sourceReference: string;
  idempotencyKey: string;
}) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("worker_start_presence", {
    schedule_entry_id: input.scheduleEntryId,
    source_reference: input.sourceReference,
    idempotency_key: input.idempotencyKey,
  });
}

export async function completeWorkerPresenceRecord(input: {
  scheduleEntryId: string;
  idempotencyKey: string;
}) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("worker_complete_presence", {
    schedule_entry_id: input.scheduleEntryId,
    idempotency_key: input.idempotencyKey,
  });
}

export async function listWorkerPresenceHistoryRecords(input: {
  limit: number;
  beforeArrivedAt: string | null;
  beforeScheduleEntryId: string | null;
}) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("list_worker_presence_history", {
    result_limit: input.limit,
    before_arrived_at: input.beforeArrivedAt ?? undefined,
    before_schedule_entry_id: input.beforeScheduleEntryId ?? undefined,
  });
}

export type WorkerPresenceRepositoryError = Pick<
  PostgrestError,
  "code" | "message"
>;
