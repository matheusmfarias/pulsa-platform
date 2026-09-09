import { requireWorkerAccess } from "@/modules/worker-access";
import { AppError } from "@/shared/errors";

import type {
  WorkerHome,
  WorkerScheduleEntry,
} from "../domain/worker-schedule";
import {
  findWorkerHomeRecords,
  findWorkerScheduleEntryRecord,
  listWorkerScheduleRecords,
} from "../repositories/worker-schedule-repository";
import {
  workerHomeRowSchema,
  workerScheduleEntryIdSchema,
  workerScheduleRangeSchema,
  workerScheduleRowSchema,
} from "../schemas/worker-schedule-schemas";
import { throwWorkerScheduleRepositoryError } from "./repository-errors";

function toEntry(row: unknown): WorkerScheduleEntry {
  const parsed = workerScheduleRowSchema.safeParse(row);
  if (!parsed.success) {
    throw new AppError("INFRASTRUCTURE", "Read model Worker inválido.");
  }
  return {
    scheduleEntryId: parsed.data.schedule_entry_id,
    startsAt: parsed.data.starts_at,
    endsAt: parsed.data.ends_at,
    breakStartsAt: parsed.data.break_starts_at,
    breakEndsAt: parsed.data.break_ends_at,
    localDate: parsed.data.local_date,
    operationName: parsed.data.operation_name,
    unitName: parsed.data.unit_name,
    unitTimezone: parsed.data.unit_timezone,
    unitAddress: parsed.data.unit_address,
    unitCity: parsed.data.unit_city,
    unitState: parsed.data.unit_state,
    jobRoleName: parsed.data.job_role_name,
    journeyStatus: parsed.data.journey_status,
    presenceStatus: parsed.data.presence_status,
    arrivedAt: parsed.data.arrived_at,
    departedAt: parsed.data.departed_at,
    scheduleVersion: parsed.data.schedule_version,
    publishedAt: parsed.data.published_at,
    wasRepublished: parsed.data.was_republished,
  };
}

export async function getWorkerHome(): Promise<WorkerHome> {
  const access = await requireWorkerAccess();
  const { data, error } = await findWorkerHomeRecords();
  if (error) throwWorkerScheduleRepositoryError(error, "get_worker_home");

  const home: WorkerHome = {
    workerName: access.workerName,
    current: null,
    today: null,
    next: null,
  };
  for (const row of data) {
    const parsed = workerHomeRowSchema.safeParse(row);
    if (!parsed.success) {
      throw new AppError("INFRASTRUCTURE", "Read model Home Worker inválido.");
    }
    const entry = toEntry(parsed.data);
    if (parsed.data.home_slot === "current") home.current = entry;
    if (parsed.data.home_slot === "today") home.today = entry;
    if (parsed.data.home_slot === "next") home.next = entry;
  }
  return home;
}

export async function listWorkerSchedule(input: unknown): Promise<WorkerScheduleEntry[]> {
  await requireWorkerAccess();
  const parsed = workerScheduleRangeSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Período inválido.",
    );
  }
  const { data, error } = await listWorkerScheduleRecords(
    parsed.data.fromDate,
    parsed.data.toDate,
  );
  if (error) throwWorkerScheduleRepositoryError(error, "list_worker_schedule");
  return data.map(toEntry);
}

export async function getWorkerScheduleEntry(
  entryId: unknown,
): Promise<WorkerScheduleEntry> {
  await requireWorkerAccess();
  const parsed = workerScheduleEntryIdSchema.safeParse(entryId);
  if (!parsed.success) throw new AppError("NOT_FOUND", "Jornada não encontrada.");

  const { data, error } = await findWorkerScheduleEntryRecord(parsed.data);
  if (error) {
    throwWorkerScheduleRepositoryError(error, "get_worker_schedule_entry");
  }
  if (!data) throw new AppError("NOT_FOUND", "Jornada não encontrada.");
  return toEntry(data);
}
