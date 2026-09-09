"use server";

import { revalidatePath } from "next/cache";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import type { WorkerPresenceActionState } from "./domain/worker-presence";
import {
  completeWorkerPresence,
  startWorkerPresence,
} from "./services/worker-presence";

function refreshWorkerPresence(scheduleEntryId: string) {
  revalidatePath("/worker");
  revalidatePath("/worker/schedule");
  revalidatePath(`/worker/schedule/${scheduleEntryId}`);
  revalidatePath("/worker/history");
}

function actionError(
  error: unknown,
  operation: string,
): WorkerPresenceActionState {
  if (!isAppError(error)) {
    logger.error({ event: "worker_presence.action_failed", operation });
  }
  return { error: toPublicErrorMessage(error) };
}

export async function workerStartPresenceAction(
  scheduleEntryId: string,
  _previousState: WorkerPresenceActionState,
  formData: FormData,
): Promise<WorkerPresenceActionState> {
  void _previousState;
  try {
    await startWorkerPresence({
      scheduleEntryId,
      sourceReference: formData.get("sourceReference"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
  } catch (error) {
    if (isAppError(error) && error.code === "CONFLICT") {
      refreshWorkerPresence(scheduleEntryId);
    }
    return actionError(error, "worker_start_presence");
  }
  refreshWorkerPresence(scheduleEntryId);
  return { error: null, success: true };
}

export async function workerCompletePresenceAction(
  scheduleEntryId: string,
  _previousState: WorkerPresenceActionState,
  formData: FormData,
): Promise<WorkerPresenceActionState> {
  void _previousState;
  try {
    await completeWorkerPresence({
      scheduleEntryId,
      idempotencyKey: formData.get("idempotencyKey"),
    });
  } catch (error) {
    if (isAppError(error) && error.code === "CONFLICT") {
      refreshWorkerPresence(scheduleEntryId);
    }
    return actionError(error, "worker_complete_presence");
  }
  refreshWorkerPresence(scheduleEntryId);
  return { error: null, success: true };
}
