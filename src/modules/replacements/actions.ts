"use server";

import { revalidatePath } from "next/cache";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { createReplacement, cancelReplacement } from "./services/replacement-services";
import { createReplacementSchema, replacementIdSchema } from "./schemas/replacement-schemas";

export type ReplacementActionState = { error: string | null; success?: boolean };

function actionError(error: unknown, operation: string): ReplacementActionState {
  if (!isAppError(error)) logger.error({ event: "replacement.action_failed", operation });
  return { error: toPublicErrorMessage(error) };
}

export async function createReplacementAction(
  absenceId: string,
  scheduleId: string,
  _previousState: ReplacementActionState,
  formData: FormData,
): Promise<ReplacementActionState> {
  const input = createReplacementSchema.safeParse({ absence_id: absenceId, assignment_id: formData.get("assignment_id") });
  if (!input.success) return { error: "Selecione um colaborador elegível." };
  try {
    await createReplacement(input.data);
  } catch (error) {
    return actionError(error, "create_replacement");
  }
  revalidatePath("/app/absences");
  revalidatePath(`/app/absences/${absenceId}`);
  revalidatePath(`/app/scheduling/${scheduleId}`);
  return { error: null, success: true };
}

export async function cancelReplacementAction(
  replacementId: string,
  absenceId: string,
  scheduleId: string,
  _previousState: ReplacementActionState,
): Promise<ReplacementActionState> {
  void _previousState;
  const input = replacementIdSchema.safeParse(replacementId);
  if (!input.success) return { error: "Substituição inválida." };
  try {
    await cancelReplacement(input.data);
  } catch (error) {
    return actionError(error, "cancel_replacement");
  }
  revalidatePath("/app/absences");
  revalidatePath(`/app/absences/${absenceId}`);
  revalidatePath(`/app/scheduling/${scheduleId}`);
  return { error: null, success: true };
}
