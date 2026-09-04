import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { scheduleEntrySchema, scheduleRevisionSchema, scheduleRevisionWithEntriesSchema, scheduleSchema, type Schedule, type ScheduleEntry, type ScheduleRevision, type ScheduleRevisionWithEntries } from "../domain/scheduling";
import { createEntryRecord, createScheduleRecord, deleteEntryRecord, findCurrentPublishedRevision, findRevisionWithEntries, findRevisions, findScheduleById, findSchedules, transitionRevision, updateEntryRecord } from "../repositories/scheduling-repository";
import { createScheduleSchema, scheduleEntryIdSchema, scheduleEntryInputSchema, scheduleIdSchema, scheduleRevisionIdSchema, updateScheduleEntrySchema } from "../schemas/scheduling-schemas";
import { throwSchedulingRepositoryError } from "./repository-errors";

async function mutateRevision(revisionId: unknown, permission: "schedule:submit" | "schedule:approve" | "schedule:update" | "schedule:publish" | "schedule:create", rpc: "submit_schedule_revision" | "approve_schedule_revision" | "return_schedule_revision_to_draft" | "publish_schedule_revision" | "create_schedule_revision_from_published"): Promise<ScheduleRevision> {
  await requirePermission(permission);
  const id = scheduleRevisionIdSchema.parse(revisionId);
  const { data, error } = await transitionRevision(rpc, id);
  if (error) throwSchedulingRepositoryError(error, rpc);
  return scheduleRevisionSchema.parse(data);
}

export async function createSchedule(input: unknown): Promise<Schedule> {
  await requirePermission("schedule:create");
  const { data, error } = await createScheduleRecord(createScheduleSchema.parse(input));
  if (error) throwSchedulingRepositoryError(error, "create_schedule");
  return scheduleSchema.parse(data);
}

export async function createScheduleEntry(input: unknown): Promise<ScheduleEntry> {
  await requirePermission("schedule:update");
  const { data, error } = await createEntryRecord(scheduleEntryInputSchema.parse(input));
  if (error) throwSchedulingRepositoryError(error, "create_schedule_entry");
  return scheduleEntrySchema.parse(data);
}

export async function updateScheduleEntry(entryId: unknown, input: unknown): Promise<ScheduleEntry> {
  await requirePermission("schedule:update");
  const { data, error } = await updateEntryRecord(scheduleEntryIdSchema.parse(entryId), updateScheduleEntrySchema.parse(input));
  if (error) throwSchedulingRepositoryError(error, "update_schedule_entry");
  return scheduleEntrySchema.parse(data);
}

export async function deleteScheduleEntry(entryId: unknown): Promise<ScheduleEntry> {
  await requirePermission("schedule:update");
  const { data, error } = await deleteEntryRecord(scheduleEntryIdSchema.parse(entryId));
  if (error) throwSchedulingRepositoryError(error, "delete_schedule_entry");
  return scheduleEntrySchema.parse(data);
}

export const submitScheduleRevision = (id: unknown) => mutateRevision(id, "schedule:submit", "submit_schedule_revision");
export const approveScheduleRevision = (id: unknown) => mutateRevision(id, "schedule:approve", "approve_schedule_revision");
export const returnScheduleRevisionToDraft = (id: unknown) => mutateRevision(id, "schedule:update", "return_schedule_revision_to_draft");
export const publishScheduleRevision = (id: unknown) => mutateRevision(id, "schedule:publish", "publish_schedule_revision");
export const createRevisionFromPublished = (id: unknown) => mutateRevision(id, "schedule:create", "create_schedule_revision_from_published");

export async function listSchedules(): Promise<Schedule[]> {
  await requirePermission("schedule:read");
  const { data, error } = await findSchedules();
  if (error) throwSchedulingRepositoryError(error, "list_schedules");
  return (data ?? []).map((row) => scheduleSchema.parse(row));
}

export async function getSchedule(id: unknown): Promise<Schedule> {
  await requirePermission("schedule:read");
  const { data, error } = await findScheduleById(scheduleIdSchema.parse(id));
  if (error) throwSchedulingRepositoryError(error, "get_schedule");
  if (!data) throw new AppError("NOT_FOUND", "Escala não encontrada.");
  return scheduleSchema.parse(data);
}

export async function listScheduleRevisions(scheduleId: unknown): Promise<ScheduleRevision[]> {
  await requirePermission("schedule:read");
  const { data, error } = await findRevisions(scheduleIdSchema.parse(scheduleId));
  if (error) throwSchedulingRepositoryError(error, "list_revisions");
  return (data ?? []).map((row) => scheduleRevisionSchema.parse(row));
}

export async function getScheduleRevisionWithEntries(id: unknown): Promise<ScheduleRevisionWithEntries> {
  await requirePermission("schedule:read");
  const { data, error } = await findRevisionWithEntries(scheduleRevisionIdSchema.parse(id));
  if (error) throwSchedulingRepositoryError(error, "get_revision");
  if (!data) throw new AppError("NOT_FOUND", "Revisão de escala não encontrada.");
  return scheduleRevisionWithEntriesSchema.parse(data);
}

export async function getCurrentPublishedRevision(scheduleId: unknown): Promise<ScheduleRevisionWithEntries | null> {
  await requirePermission("schedule:read");
  const { data, error } = await findCurrentPublishedRevision(scheduleIdSchema.parse(scheduleId));
  if (error) throwSchedulingRepositoryError(error, "get_current_published_revision");
  return data ? scheduleRevisionWithEntriesSchema.parse(data) : null;
}
