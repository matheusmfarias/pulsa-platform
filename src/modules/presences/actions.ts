"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import {
  cancelPresence,
  completePresence,
  correctPresence,
  startPresence,
} from "./services/presence-services";
import {
  presenceIdSchema,
  presenceScheduleEntryIdSchema,
} from "./schemas/presence-schemas";

export type PresenceActionState = { error: string | null; success?: boolean };

function actionError(error: unknown, operation: string): PresenceActionState {
  if (!isAppError(error)) {
    logger.error({ event: "presence.action_failed", operation });
  }
  return { error: toPublicErrorMessage(error) };
}

function refreshPresenceView() {
  revalidatePath("/app/presences");
}

export async function startPresenceAction(
  scheduleEntryId: string,
  _previousState: PresenceActionState,
): Promise<PresenceActionState> {
  void _previousState;
  const entry = presenceScheduleEntryIdSchema.safeParse(scheduleEntryId);
  if (!entry.success) return { error: "Entrada de escala inválida." };
  try {
    await startPresence({
      schedule_entry_id: entry.data,
      arrived_at: new Date().toISOString(),
      idempotency_key: randomUUID(),
      source: "manual",
      source_reference: null,
    });
  } catch (error) {
    return actionError(error, "start_presence");
  }
  refreshPresenceView();
  return { error: null, success: true };
}

export async function completePresenceAction(
  presenceId: string,
  _previousState: PresenceActionState,
): Promise<PresenceActionState> {
  void _previousState;
  const presence = presenceIdSchema.safeParse(presenceId);
  if (!presence.success) return { error: "Presença inválida." };
  try {
    await completePresence({
      presence_id: presence.data,
      departed_at: new Date().toISOString(),
      idempotency_key: randomUUID(),
      source: "manual",
      source_reference: null,
    });
  } catch (error) {
    return actionError(error, "complete_presence");
  }
  refreshPresenceView();
  return { error: null, success: true };
}

export async function correctPresenceAction(
  presenceId: string,
  _previousState: PresenceActionState,
  formData: FormData,
): Promise<PresenceActionState> {
  const presence = presenceIdSchema.safeParse(presenceId);
  if (!presence.success) return { error: "Presença inválida." };
  try {
    await correctPresence({
      presence_id: presence.data,
      arrived_at: formData.get("arrived_at"),
      departed_at: formData.get("departed_at"),
      reason: formData.get("reason"),
      idempotency_key: randomUUID(),
      source: "manual",
      source_reference: null,
    });
  } catch (error) {
    return actionError(error, "correct_presence");
  }
  refreshPresenceView();
  return { error: null, success: true };
}

export async function cancelPresenceAction(
  presenceId: string,
  _previousState: PresenceActionState,
  formData: FormData,
): Promise<PresenceActionState> {
  const presence = presenceIdSchema.safeParse(presenceId);
  if (!presence.success) return { error: "Presença inválida." };
  try {
    await cancelPresence({
      presence_id: presence.data,
      reason: formData.get("reason"),
      idempotency_key: randomUUID(),
      source: "manual",
      source_reference: null,
    });
  } catch (error) {
    return actionError(error, "cancel_presence");
  }
  refreshPresenceView();
  return { error: null, success: true };
}
