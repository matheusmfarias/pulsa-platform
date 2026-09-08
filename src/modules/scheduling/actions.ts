"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { copyScheduleSchema, scheduleEntryIdSchema, scheduleEntryInputSchema, scheduleIdSchema, scheduleRevisionIdSchema, updateScheduleEntrySchema, createScheduleSchema } from "./schemas/scheduling-schemas";
import { localDateTimeToUtc } from "./domain/weekly-schedule";
import {
  approveScheduleRevision,
  copyScheduleFromPublished,
  copyScheduleEntryToDaysInDraft,
  createRevisionFromPublished,
  createSchedule,
  createScheduleEntry,
  deleteScheduleEntry,
  deleteScheduleEntries,
  publishScheduleRevision,
  returnScheduleRevisionToDraft,
  submitScheduleRevision,
  updateScheduleEntry,
} from "./services/scheduling-services";

type ScheduleField = "operation_id" | "period_start" | "period_end";

export type ScheduleActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<ScheduleField, string[]>>;
};

function readEntryInput(formData: FormData, includeRevision: boolean) {
  const date = String(formData.get("date") ?? "");
  const timeZone = String(formData.get("time_zone") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const breakStartsAt = String(formData.get("break_starts_at") ?? "");
  const breakEndsAt = String(formData.get("break_ends_at") ?? "");
  const input = {
    assignment_id: formData.get("assignment_id"),
    starts_at: localDateTimeToUtc(date, startsAt, timeZone),
    ends_at: localDateTimeToUtc(date, endsAt, timeZone),
    break_starts_at: breakStartsAt ? localDateTimeToUtc(date, breakStartsAt, timeZone) : null,
    break_ends_at: breakEndsAt ? localDateTimeToUtc(date, breakEndsAt, timeZone) : null,
    ...(includeRevision ? { schedule_revision_id: formData.get("schedule_revision_id") } : {}),
  };
  return includeRevision ? scheduleEntryInputSchema.safeParse(input) : updateScheduleEntrySchema.safeParse(input);
}

export async function createScheduleEntryAction(scheduleId: string, _previousState: ScheduleActionState, formData: FormData): Promise<ScheduleActionState> {
  const input = readEntryInput(formData, true);
  if (!input.success) return { error: "Revise os horários e o intervalo informados." };
  try { await createScheduleEntry(input.data); } catch (error) { return initialError(error, "create_schedule_entry"); }
  revalidatePath(`/app/scheduling/${scheduleId}`);
  return { error: null };
}

export async function updateScheduleEntryAction(scheduleId: string, entryId: string, _previousState: ScheduleActionState, formData: FormData): Promise<ScheduleActionState> {
  const id = scheduleEntryIdSchema.safeParse(entryId);
  const input = readEntryInput(formData, false);
  if (!id.success || !input.success) return { error: "Revise os horários e o intervalo informados." };
  try { await updateScheduleEntry(id.data, input.data); } catch (error) { return initialError(error, "update_schedule_entry"); }
  revalidatePath(`/app/scheduling/${scheduleId}`);
  return { error: null };
}

export async function deleteScheduleEntryAction(scheduleId: string, entryId: string): Promise<ScheduleActionState> {
  const id = scheduleEntryIdSchema.safeParse(entryId);
  if (!id.success) return { error: "Entrada de escala inválida." };
  try { await deleteScheduleEntry(id.data); } catch (error) { return initialError(error, "delete_schedule_entry"); }
  revalidatePath(`/app/scheduling/${scheduleId}`);
  return { error: null };
}

export async function copyScheduleEntryToDaysAction(scheduleId: string, revisionId: string, entryId: string, _previousState: ScheduleActionState, formData: FormData): Promise<ScheduleActionState> {
  try {
    const result = await copyScheduleEntryToDaysInDraft(revisionId, entryId, formData.getAll("target_dates").map(String));
    revalidatePath(`/app/scheduling/${scheduleId}`);
    return { error: result.skipped ? `${result.copied} entradas copiadas; ${result.skipped} datas não eram elegíveis.` : `${result.copied} entradas copiadas.` };
  } catch (error) { return initialError(error, "copy_schedule_entry_to_days"); }
}

export async function deleteScheduleEntriesAction(scheduleId: string, entryIds: string[]): Promise<ScheduleActionState> {
  try { await deleteScheduleEntries(entryIds); } catch (error) { return initialError(error, "delete_schedule_entries"); }
  revalidatePath(`/app/scheduling/${scheduleId}`);
  return { error: null };
}

const initialError = (error: unknown, operation: string): ScheduleActionState => {
  if (!isAppError(error)) logger.error({ event: "scheduling.action_failed", operation });
  return { error: toPublicErrorMessage(error) };
};

export async function createScheduleAction(
  _previousState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const fields = {
    organization_id: formData.get("organization_id"),
    operation_id: formData.get("operation_id"),
    period_start: formData.get("period_start"),
    period_end: formData.get("period_end"),
  };
  const copyMode = formData.get("creation_mode") === "copy";
  const input = (copyMode ? copyScheduleSchema : createScheduleSchema).safeParse({
    ...fields,
    ...(copyMode ? { source_schedule_id: formData.get("source_schedule_id") } : {}),
  });
  if (!input.success) return { error: "Revise os campos informados.", fieldErrors: input.error.flatten().fieldErrors };

  let scheduleId: string;
  let copySummary: { copied: number; skipped: number } | null = null;
  try {
    if (copyMode) {
      const result = await copyScheduleFromPublished(input.data);
      scheduleId = result.schedule.id;
      copySummary = result;
    } else {
      scheduleId = (await createSchedule(input.data)).id;
    }
  } catch (error) {
    return initialError(error, "create_schedule");
  }
  revalidatePath("/app/scheduling");
  const summary = copySummary ? `?copy=${copySummary.copied}-${copySummary.skipped}` : "";
  redirect(`/app/scheduling/${scheduleId}${summary}`);
}

export async function transitionScheduleRevisionAction(
  scheduleId: string,
  revisionId: string,
  action: string,
): Promise<ScheduleActionState> {
  const parsed = z.object({
    scheduleId: scheduleIdSchema,
    revisionId: scheduleRevisionIdSchema,
    action: z.enum(["submit", "approve", "return", "publish", "copy"]),
  }).safeParse({ scheduleId, revisionId, action });
  if (!parsed.success) return { error: "Ação de revisão inválida." };

  try {
    const operations = {
      submit: submitScheduleRevision,
      approve: approveScheduleRevision,
      return: returnScheduleRevisionToDraft,
      publish: publishScheduleRevision,
      copy: createRevisionFromPublished,
    };
    await operations[parsed.data.action](parsed.data.revisionId);
  } catch (error) {
    return initialError(error, `schedule_revision_${parsed.data.action}`);
  }

  revalidatePath("/app/scheduling");
  revalidatePath(`/app/scheduling/${parsed.data.scheduleId}`);
  return { error: null };
}
