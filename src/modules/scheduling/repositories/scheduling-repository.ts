import { createServerSupabaseClient } from "@/shared/db/supabase";

import type { CreateScheduleInput, ScheduleEntryInput, UpdateScheduleEntryInput } from "../schemas/scheduling-schemas";

const SCHEDULE_SELECT = "*, operation:operations!inner(id, name)";
const REVISION_SELECT = "*, schedule:schedules!inner(*)";
const REVISION_WITH_ENTRIES_SELECT = "*, schedule:schedules!inner(*), entries:schedule_entries(*, assignment:assignments!inner(id, worker_id, position_id, start_date, end_date, status, worker:workers!inner(id, full_name, status), position:positions!inner(id, status, job_role:job_roles!inner(id, name), unit:units!inner(id, name, timezone, operation:operations!inner(id, name)))))";

export async function createScheduleRecord(input: CreateScheduleInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("create_schedule", input);
}

export async function createEntryRecord(input: ScheduleEntryInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("create_schedule_entry", input);
}

export async function updateEntryRecord(entryId: string, input: UpdateScheduleEntryInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("update_schedule_entry", { entry_id: entryId, ...input });
}

export async function deleteEntryRecord(entryId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("delete_schedule_entry", { entry_id: entryId });
}

export async function transitionRevision(rpc: "submit_schedule_revision" | "approve_schedule_revision" | "return_schedule_revision_to_draft" | "publish_schedule_revision" | "create_schedule_revision_from_published", revisionId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc(rpc, { schedule_revision_id: revisionId });
}

export async function findSchedules() {
  const supabase = await createServerSupabaseClient();
  return supabase.from("schedules").select(SCHEDULE_SELECT).order("period_start", { ascending: false });
}

export async function findScheduleById(scheduleId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.from("schedules").select(SCHEDULE_SELECT).eq("id", scheduleId).maybeSingle();
}

export async function findRevisions(scheduleId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.from("schedule_revisions").select(REVISION_SELECT).eq("schedule_id", scheduleId).order("version", { ascending: false });
}

export async function findRevisionWithEntries(revisionId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.from("schedule_revisions").select(REVISION_WITH_ENTRIES_SELECT).eq("id", revisionId).maybeSingle();
}

export async function findCurrentPublishedRevision(scheduleId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.from("schedule_revisions").select(REVISION_WITH_ENTRIES_SELECT).eq("schedule_id", scheduleId).eq("status", "published").order("version", { ascending: false }).limit(1).maybeSingle();
}
