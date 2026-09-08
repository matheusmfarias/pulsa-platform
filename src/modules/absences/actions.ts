"use server";

import { revalidatePath } from "next/cache";

import { scheduleIdSchema } from "@/modules/scheduling";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { absenceIdSchema, createAbsenceSchema } from "./schemas/absence-schemas";
import { cancelAbsence, createAbsence } from "./services/absence-services";

export type AbsenceActionState = {
  error: string | null;
  success?: boolean;
};

function actionError(error: unknown, operation: string): AbsenceActionState {
  if (!isAppError(error)) {
    logger.error({ event: "absence.action_failed", operation });
  }
  return { error: toPublicErrorMessage(error) };
}

export async function createAbsenceAction(
  scheduleId: string,
  scheduleEntryId: string,
  _previousState: AbsenceActionState,
  formData: FormData,
): Promise<AbsenceActionState> {
  const schedule = scheduleIdSchema.safeParse(scheduleId);
  const input = createAbsenceSchema.safeParse({
    schedule_entry_id: scheduleEntryId,
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });
  if (!schedule.success || !input.success) {
    return { error: "Revise o motivo e a observação informados." };
  }

  try {
    await createAbsence(input.data);
  } catch (error) {
    return actionError(error, "create_absence");
  }

  revalidatePath("/app/absences");
  revalidatePath(`/app/scheduling/${schedule.data}`);
  return { error: null, success: true };
}

export async function cancelAbsenceAction(
  absenceId: string,
  scheduleId: string,
  _previousState: AbsenceActionState,
): Promise<AbsenceActionState> {
  void _previousState;
  const input = absenceIdSchema.safeParse(absenceId);
  const schedule = scheduleIdSchema.safeParse(scheduleId);
  if (!input.success || !schedule.success) {
    return { error: "Ausência inválida." };
  }

  try {
    await cancelAbsence(input.data);
  } catch (error) {
    return actionError(error, "cancel_absence");
  }

  revalidatePath("/app/absences");
  revalidatePath(`/app/absences/${input.data}`);
  revalidatePath(`/app/scheduling/${schedule.data}`);
  return { error: null, success: true };
}
