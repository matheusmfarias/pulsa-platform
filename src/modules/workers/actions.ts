"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { workerStatusSchema } from "./domain/worker";
import { workerIdSchema, workerInputSchema } from "./schemas/worker-schemas";
import { changeWorkerStatus } from "./services/change-worker-status";
import { createWorker } from "./services/create-worker";
import { updateWorker } from "./services/update-worker";

type WorkerField =
  | "full_name"
  | "document_number"
  | "email"
  | "phone"
  | "engagement_start_date"
  | "engagement_end_date";

export type WorkerActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<WorkerField, string[]>>;
};

function invalidInputState(error: z.ZodError): WorkerActionState {
  return {
    error: "Revise os campos informados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function actionErrorState(
  error: unknown,
  operation: string,
): WorkerActionState {
  if (!isAppError(error)) {
    logger.error({ event: "workers.action_failed", operation });
  }
  return { error: toPublicErrorMessage(error) };
}

function readWorkerInput(formData: FormData) {
  return workerInputSchema.safeParse({
    full_name: formData.get("full_name"),
    document_number: formData.get("document_number"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    engagement_start_date: formData.get("engagement_start_date"),
    engagement_end_date: formData.get("engagement_end_date"),
  });
}

export async function createWorkerAction(
  _previousState: WorkerActionState,
  formData: FormData,
): Promise<WorkerActionState> {
  const input = readWorkerInput(formData);
  if (!input.success) return invalidInputState(input.error);

  let workerId: string;
  try {
    const worker = await createWorker(input.data);
    workerId = worker.id;
  } catch (error) {
    return actionErrorState(error, "create_worker");
  }

  revalidatePath("/app/workers");
  redirect(`/app/workers/${workerId}`);
}

export async function updateWorkerAction(
  workerId: string,
  _previousState: WorkerActionState,
  formData: FormData,
): Promise<WorkerActionState> {
  const id = workerIdSchema.safeParse(workerId);
  const input = readWorkerInput(formData);
  if (!id.success) return { error: id.error.issues[0].message };
  if (!input.success) return invalidInputState(input.error);

  try {
    await updateWorker(id.data, input.data);
  } catch (error) {
    return actionErrorState(error, "update_worker");
  }

  revalidatePath("/app/workers");
  revalidatePath(`/app/workers/${id.data}`);
  redirect(`/app/workers/${id.data}`);
}

export async function changeWorkerStatusAction(
  workerId: string,
  targetStatus: string,
): Promise<WorkerActionState> {
  const input = z
    .object({ id: workerIdSchema, status: workerStatusSchema })
    .safeParse({ id: workerId, status: targetStatus });
  if (!input.success) return { error: "Ação de status inválida." };

  try {
    await changeWorkerStatus(input.data.id, input.data.status);
  } catch (error) {
    return actionErrorState(error, "change_worker_status");
  }

  revalidatePath("/app/workers");
  revalidatePath(`/app/workers/${input.data.id}`);
  redirect(`/app/workers/${input.data.id}`);
}
