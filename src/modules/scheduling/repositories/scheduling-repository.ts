import { createServerSupabaseClient } from "@/shared/db/supabase";
import {
  applyOperationalContextFilter,
  OPERATIONAL_CONTEXT_QUERY_PATHS,
  type OperationalContext,
} from "@/modules/operational-context";

import type { CreateScheduleInput, ScheduleEntryInput, UpdateScheduleEntryInput } from "../schemas/scheduling-schemas";

const SCHEDULE_SELECT = "*, operation:operations!inner(id, name)";
const REVISION_SELECT = "*, schedule:schedules!inner(*)";
const REVISION_WITH_ENTRIES_SELECT = "*, schedule:schedules!inner(*), entries:schedule_entries(*, absences(id, reason, status, replacements(id, status, replacement_assignment_id, replacement_assignment:assignments!replacements_replacement_assignment_id_fkey(worker:workers!inner(id, full_name)))), assignment:assignments!inner(id, worker_id, position_id, start_date, end_date, status, worker:workers!inner(id, full_name, status), position:positions!inner(id, status, job_role:job_roles!inner(id, name), unit:units!inner(id, name, timezone, operation:operations!inner(id, name)))))";
const SCHEDULE_OVERVIEW_SELECT = "*, operation:operations!inner(id, name, contract:contracts!inner(client_id, id)), revisions:schedule_revisions(id, schedule_id, version, status, based_on_revision_id, created_at, created_by, submitted_at, submitted_by, approved_at, approved_by, published_at, published_by)";
const SCHEDULE_COPY_SOURCE_SELECT = "*, operation:operations!inner(id, name), revisions:schedule_revisions!inner(id, version, status)";

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

export async function findScheduleOverviews(operationalContext: OperationalContext) {
  const supabase = await createServerSupabaseClient();
  const query = supabase
    .from("schedules")
    .select(SCHEDULE_OVERVIEW_SELECT)
    .order("period_start", { ascending: false })
    .order("version", { ascending: false, referencedTable: "revisions" });
  return applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.schedules,
  );
}

export async function findPublishedScheduleCopySources(operationalContext: OperationalContext) {
  const supabase = await createServerSupabaseClient();
  const query = supabase
    .from("schedules")
    .select(SCHEDULE_COPY_SOURCE_SELECT)
    .eq("revisions.status", "published")
    .order("period_start", { ascending: false });
  return applyOperationalContextFilter(
    query,
    operationalContext,
    OPERATIONAL_CONTEXT_QUERY_PATHS.schedules,
  );
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
