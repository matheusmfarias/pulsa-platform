import { requirePermission } from "@/modules/authorization";
import { ALL_OPERATIONAL_CONTEXT, type OperationalContext } from "@/modules/operational-context";
import { AppError } from "@/shared/errors";

import { scheduleEntrySchema, scheduleRevisionSchema, scheduleRevisionWithEntriesSchema, scheduleSchema, type Schedule, type ScheduleEntry, type ScheduleOverview, type ScheduleRevision, type ScheduleRevisionWithEntries } from "../domain/scheduling";
import { copyScheduleEntriesToPeriod, copyScheduleEntryToDays } from "./schedule-copy";
import { createEntryRecord, createScheduleRecord, deleteEntryRecord, findCurrentPublishedRevision, findPublishedScheduleCopySources, findRevisionWithEntries, findRevisions, findScheduleById, findScheduleOverviews, findSchedules, transitionRevision, updateEntryRecord } from "../repositories/scheduling-repository";
import { copyScheduleSchema, createScheduleSchema, scheduleEntryIdSchema, scheduleEntryInputSchema, scheduleIdSchema, scheduleRevisionIdSchema, updateScheduleEntrySchema } from "../schemas/scheduling-schemas";
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

export type PublishedScheduleCopySource = Schedule & {
  operation: { id: string; name: string };
  publishedVersion: number;
};

export async function listPublishedScheduleCopySources(
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<PublishedScheduleCopySource[]> {
  await requirePermission("schedule:read");
  const { data, error } = await findPublishedScheduleCopySources(operationalContext);
  if (error) throwSchedulingRepositoryError(error, "list_published_schedule_copy_sources");
  return (data ?? []).map((row) => ({
    ...scheduleSchema.parse(row),
    operation: row.operation as { id: string; name: string },
    publishedVersion: Math.max(...(row.revisions as Array<{ version: number }>).map((revision) => revision.version)),
  }));
}

export async function copyScheduleFromPublished(input: unknown) {
  await requirePermission("schedule:create");
  await requirePermission("schedule:update");
  const parsed = copyScheduleSchema.parse(input);
  const [sourceSchedule, sourceRevision] = await Promise.all([
    getSchedule(parsed.source_schedule_id),
    getCurrentPublishedRevision(parsed.source_schedule_id),
  ]);
  if (sourceSchedule.operation_id !== parsed.operation_id) {
    throw new AppError("VALIDATION", "A escala de origem deve pertencer à mesma operação.");
  }
  if (sourceSchedule.period_end >= parsed.period_start) {
    throw new AppError("VALIDATION", "Selecione uma escala publicada anterior ao novo período.");
  }
  if (!sourceRevision) {
    throw new AppError("VALIDATION", "A escala de origem não possui uma revisão publicada atual.");
  }

  const schedule = await createSchedule(parsed);
  const revisions = await listScheduleRevisions(schedule.id);
  const draft = revisions.find((revision) => revision.version === 1 && revision.status === "draft");
  if (!draft) throw new AppError("INFRASTRUCTURE", "Não foi possível preparar a revisão inicial da escala.");

  const translated = copyScheduleEntriesToPeriod(
    sourceRevision.entries,
    sourceSchedule.period_start,
    schedule.period_start,
    schedule.period_end,
  );
  for (const entry of translated.copied) {
    await createScheduleEntry({ ...entry, schedule_revision_id: draft.id });
  }
  return { schedule, copied: translated.copied.length, skipped: translated.skipped };
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

export async function copyScheduleEntryToDaysInDraft(revisionId: unknown, entryId: unknown, dates: string[]) {
  await requirePermission("schedule:update");
  const revision = await getScheduleRevisionWithEntries(scheduleRevisionIdSchema.parse(revisionId));
  if (revision.status !== "draft") throw new AppError("CONFLICT", "Apenas revisões em rascunho podem ser alteradas.");
  const entry = revision.entries.find((item) => item.id === scheduleEntryIdSchema.parse(entryId));
  if (!entry) throw new AppError("NOT_FOUND", "Entrada de escala não encontrada.");
  const translated = copyScheduleEntryToDays(entry, dates, revision.schedule.period_start, revision.schedule.period_end);
  for (const input of translated.copied) await createScheduleEntry({ ...input, schedule_revision_id: revision.id });
  return { copied: translated.copied.length, skipped: translated.skipped };
}

export async function deleteScheduleEntries(entryIds: unknown[]) {
  await requirePermission("schedule:update");
  const ids = [...new Set(entryIds.map((entryId) => scheduleEntryIdSchema.parse(entryId)))];
  for (const id of ids) await deleteScheduleEntry(id);
  return ids.length;
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

export async function listScheduleOverviews(
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<ScheduleOverview[]> {
  await requirePermission("schedule:read");
  const { data, error } = await findScheduleOverviews(operationalContext);
  if (error) throwSchedulingRepositoryError(error, "list_schedule_overviews");
  return (data ?? []).map((row) => {
    const schedule = scheduleSchema.parse(row);
    const operation = row.operation as { id: string; name: string };
    const revisions = (row.revisions ?? [])
      .map((revision) => scheduleRevisionSchema.parse(revision))
      .sort((left, right) => right.version - left.version);
    return { ...schedule, operation, latestRevision: revisions[0] ?? null };
  });
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
