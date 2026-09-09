import { requireWorkerAccess } from "@/modules/worker-access";
import { AppError } from "@/shared/errors";

import type {
  WorkerPresenceAction,
  WorkerPresenceHistoryEntry,
  WorkerPresenceHistoryPage,
  WorkerPresenceResult,
} from "../domain/worker-presence";
import {
  completeWorkerPresenceRecord,
  findWorkerPresenceAction,
  listWorkerPresenceHistoryRecords,
  startWorkerPresenceRecord,
} from "../repositories/worker-presence-repository";
import {
  workerCompletePresenceSchema,
  workerPresenceActionSchema,
  workerPresenceHistoryInputSchema,
  workerPresenceHistoryRowSchema,
  workerPresenceResultSchema,
  workerPresenceScheduleEntryIdSchema,
  workerStartPresenceSchema,
} from "../schemas/worker-presence-schemas";
import { throwWorkerPresenceRepositoryError } from "./repository-errors";

function toResult(value: unknown): WorkerPresenceResult {
  const parsed = workerPresenceResultSchema.safeParse(value);
  if (!parsed.success) {
    throw new AppError("INFRASTRUCTURE", "Retorno Worker Presence inválido.");
  }
  return {
    scheduleEntryId: parsed.data.schedule_entry_id,
    status: parsed.data.status,
    arrivedAt: parsed.data.arrived_at,
    departedAt: parsed.data.departed_at,
  };
}

function toHistoryEntry(value: unknown): WorkerPresenceHistoryEntry {
  const parsed = workerPresenceHistoryRowSchema.safeParse(value);
  if (!parsed.success) {
    throw new AppError("INFRASTRUCTURE", "Histórico Worker inválido.");
  }
  return {
    scheduleEntryId: parsed.data.schedule_entry_id,
    presenceStatus: parsed.data.presence_status,
    arrivedAt: parsed.data.arrived_at,
    departedAt: parsed.data.departed_at,
    startsAt: parsed.data.starts_at,
    endsAt: parsed.data.ends_at,
    localDate: parsed.data.local_date,
    operationName: parsed.data.operation_name,
    unitName: parsed.data.unit_name,
    unitTimezone: parsed.data.unit_timezone,
    jobRoleName: parsed.data.job_role_name,
    workerRole: parsed.data.worker_role,
    arrivedAfterStart: parsed.data.arrived_after_start,
    departedBeforeEnd: parsed.data.departed_before_end,
  };
}

export async function getWorkerPresenceAction(
  scheduleEntryId: unknown,
): Promise<WorkerPresenceAction | null> {
  await requireWorkerAccess();
  const entry = workerPresenceScheduleEntryIdSchema.safeParse(scheduleEntryId);
  if (!entry.success) return null;
  const { data, error } = await findWorkerPresenceAction(entry.data);
  if (error) {
    throwWorkerPresenceRepositoryError(error, "get_worker_presence_action");
  }
  const parsed = workerPresenceActionSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("INFRASTRUCTURE", "Ação Worker Presence inválida.");
  }
  return parsed.data;
}

export async function startWorkerPresence(
  input: unknown,
): Promise<WorkerPresenceResult> {
  await requireWorkerAccess();
  const parsed = workerStartPresenceSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", "Comando de chegada inválido.");
  }
  const { data, error } = await startWorkerPresenceRecord(parsed.data);
  if (error) {
    throwWorkerPresenceRepositoryError(error, "worker_start_presence");
  }
  return toResult(data);
}

export async function completeWorkerPresence(
  input: unknown,
): Promise<WorkerPresenceResult> {
  await requireWorkerAccess();
  const parsed = workerCompletePresenceSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", "Comando de saída inválido.");
  }
  const { data, error } = await completeWorkerPresenceRecord(parsed.data);
  if (error) {
    throwWorkerPresenceRepositoryError(error, "worker_complete_presence");
  }
  return toResult(data);
}

export async function listWorkerPresenceHistory(
  input: unknown = {},
): Promise<WorkerPresenceHistoryPage> {
  await requireWorkerAccess();
  const parsed = workerPresenceHistoryInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", "Cursor de histórico inválido.");
  }
  const { data, error } = await listWorkerPresenceHistoryRecords(parsed.data);
  if (error) {
    throwWorkerPresenceRepositoryError(error, "list_worker_presence_history");
  }
  const entries = data.map(toHistoryEntry);
  const last = entries.at(-1);
  return {
    entries,
    nextCursor: entries.length === parsed.data.limit && last
      ? { arrivedAt: last.arrivedAt, scheduleEntryId: last.scheduleEntryId }
      : null,
  };
}
