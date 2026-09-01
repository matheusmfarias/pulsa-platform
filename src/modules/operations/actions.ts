"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { operationStatusSchema } from "./domain/operation";
import { operationIdSchema, operationInputSchema } from "./schemas/operation-schemas";
import { changeOperationStatus } from "./services/change-operation-status";
import { createOperation } from "./services/create-operation";
import { updateOperation } from "./services/update-operation";

type OperationField =
  | "contract_id"
  | "name"
  | "description"
  | "start_date"
  | "end_date"
  | "manager_user_id";

export type OperationActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<OperationField, string[]>>;
};

function invalidInputState(error: z.ZodError): OperationActionState {
  return {
    error: "Revise os campos informados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function actionErrorState(
  error: unknown,
  operation: string,
): OperationActionState {
  if (!isAppError(error)) {
    logger.error({ event: "operations.action_failed", operation });
  }

  return { error: toPublicErrorMessage(error) };
}

function readOperationInput(formData: FormData) {
  return operationInputSchema.safeParse({
    contract_id: formData.get("contract_id"),
    name: formData.get("name"),
    description: formData.get("description"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    manager_user_id: formData.get("manager_user_id"),
  });
}

export async function createOperationAction(
  _previousState: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const input = readOperationInput(formData);
  if (!input.success) return invalidInputState(input.error);

  let operationId: string;
  let contractId: string;
  try {
    const operation = await createOperation(input.data);
    operationId = operation.id;
    contractId = operation.contract_id;
  } catch (error) {
    return actionErrorState(error, "create_operation");
  }

  revalidatePath("/app/operations");
  revalidatePath(`/app/contracts/${contractId}`);
  redirect(`/app/operations/${operationId}`);
}

export async function updateOperationAction(
  operationId: string,
  _previousState: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const id = operationIdSchema.safeParse(operationId);
  const input = readOperationInput(formData);

  if (!id.success) return { error: id.error.issues[0].message };
  if (!input.success) return invalidInputState(input.error);

  let contractId: string;
  try {
    const operation = await updateOperation(id.data, input.data);
    contractId = operation.contract_id;
  } catch (error) {
    return actionErrorState(error, "update_operation");
  }

  revalidatePath("/app/operations");
  revalidatePath(`/app/operations/${id.data}`);
  revalidatePath(`/app/contracts/${contractId}`);
  redirect(`/app/operations/${id.data}`);
}

export async function changeOperationStatusAction(
  operationId: string,
  targetStatus: string,
): Promise<OperationActionState> {
  const input = z
    .object({ id: operationIdSchema, status: operationStatusSchema })
    .safeParse({ id: operationId, status: targetStatus });

  if (!input.success) return { error: "Ação de status inválida." };

  let contractId: string;
  try {
    const operation = await changeOperationStatus(
      input.data.id,
      input.data.status,
    );
    contractId = operation.contract_id;
  } catch (error) {
    return actionErrorState(error, "change_operation_status");
  }

  revalidatePath("/app/operations");
  revalidatePath(`/app/operations/${input.data.id}`);
  revalidatePath(`/app/contracts/${contractId}`);
  redirect(`/app/operations/${input.data.id}`);
}
