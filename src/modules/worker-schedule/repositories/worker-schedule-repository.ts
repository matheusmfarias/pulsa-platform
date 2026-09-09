import type { PostgrestError } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/shared/db/supabase";

export async function findWorkerHomeRecords() {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("get_worker_home");
}

export async function listWorkerScheduleRecords(
  fromDate: string,
  toDate: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("list_worker_schedule", {
    from_date: fromDate,
    to_date: toDate,
  });
}

export async function findWorkerScheduleEntryRecord(scheduleEntryId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .rpc("get_worker_schedule_entry", {
      target_schedule_entry_id: scheduleEntryId,
    })
    .maybeSingle();
}

export type WorkerScheduleRepositoryError = Pick<
  PostgrestError,
  "code" | "message"
>;
