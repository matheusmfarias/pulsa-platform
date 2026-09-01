"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { assignmentStatusSchema } from "./domain/assignment";
import { assignmentIdSchema, assignmentInputSchema } from "./schemas/assignment-schemas";
import { changeAssignmentStatus } from "./services/change-assignment-status";
import { createAssignment } from "./services/create-assignment";
import { updateAssignment } from "./services/update-assignment";

type AssignmentField = "worker_id" | "position_id" | "start_date" | "end_date";
export type AssignmentActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<AssignmentField, string[]>>;
};

function invalidInputState(error: z.ZodError): AssignmentActionState {
  return { error: "Revise os campos informados.", fieldErrors: error.flatten().fieldErrors };
}

function actionErrorState(error: unknown, operation: string): AssignmentActionState {
  if (!isAppError(error)) logger.error({ event: "assignments.action_failed", operation });
  return { error: toPublicErrorMessage(error) };
}

function readAssignmentInput(formData: FormData) {
  return assignmentInputSchema.safeParse({
    worker_id: formData.get("worker_id"),
    position_id: formData.get("position_id"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
  });
}

export async function createAssignmentAction(
  _previousState: AssignmentActionState,
  formData: FormData,
): Promise<AssignmentActionState> {
  const input = readAssignmentInput(formData);
  if (!input.success) return invalidInputState(input.error);
  let assignmentId: string;
  let workerId: string;
  try {
    const assignment = await createAssignment(input.data);
    assignmentId = assignment.id;
    workerId = assignment.worker_id;
  } catch (error) {
    return actionErrorState(error, "create_assignment");
  }
  revalidatePath("/app/assignments");
  revalidatePath(`/app/workers/${workerId}`);
  redirect(`/app/assignments/${assignmentId}`);
}

export async function updateAssignmentAction(
  assignmentId: string,
  _previousState: AssignmentActionState,
  formData: FormData,
): Promise<AssignmentActionState> {
  const id = assignmentIdSchema.safeParse(assignmentId);
  const input = readAssignmentInput(formData);
  if (!id.success) return { error: id.error.issues[0].message };
  if (!input.success) return invalidInputState(input.error);
  let workerId: string;
  try {
    const assignment = await updateAssignment(id.data, input.data);
    workerId = assignment.worker_id;
  } catch (error) {
    return actionErrorState(error, "update_assignment");
  }
  revalidatePath("/app/assignments");
  revalidatePath(`/app/assignments/${id.data}`);
  revalidatePath(`/app/workers/${workerId}`);
  redirect(`/app/assignments/${id.data}`);
}

export async function changeAssignmentStatusAction(
  assignmentId: string,
  targetStatus: string,
): Promise<AssignmentActionState> {
  const input = z
    .object({ id: assignmentIdSchema, status: assignmentStatusSchema })
    .safeParse({ id: assignmentId, status: targetStatus });
  if (!input.success) return { error: "Ação de status inválida." };
  let workerId: string;
  try {
    const assignment = await changeAssignmentStatus(input.data.id, input.data.status);
    workerId = assignment.worker_id;
  } catch (error) {
    return actionErrorState(error, "change_assignment_status");
  }
  revalidatePath("/app/assignments");
  revalidatePath(`/app/assignments/${input.data.id}`);
  revalidatePath(`/app/workers/${workerId}`);
  redirect(`/app/assignments/${input.data.id}`);
}
