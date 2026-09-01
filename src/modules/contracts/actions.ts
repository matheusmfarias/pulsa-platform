"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { contractStatusSchema } from "./domain/contract";
import { contractIdSchema, contractInputSchema } from "./schemas/contract-schemas";
import { changeContractStatus } from "./services/change-contract-status";
import { createContract } from "./services/create-contract";
import { updateContract } from "./services/update-contract";

type ContractField =
  | "client_id"
  | "name"
  | "start_date"
  | "end_date"
  | "external_reference";

export type ContractActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<ContractField, string[]>>;
};

function invalidInputState(error: z.ZodError): ContractActionState {
  return {
    error: "Revise os campos informados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function actionErrorState(
  error: unknown,
  operation: string,
): ContractActionState {
  if (!isAppError(error)) {
    logger.error({ event: "contracts.action_failed", operation });
  }

  return { error: toPublicErrorMessage(error) };
}

function readContractInput(formData: FormData) {
  return contractInputSchema.safeParse({
    client_id: formData.get("client_id"),
    name: formData.get("name"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    external_reference: formData.get("external_reference"),
  });
}

export async function createContractAction(
  _previousState: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const input = readContractInput(formData);
  if (!input.success) return invalidInputState(input.error);

  let contractId: string;
  let clientId: string;
  try {
    const contract = await createContract(input.data);
    contractId = contract.id;
    clientId = contract.client_id;
  } catch (error) {
    return actionErrorState(error, "create_contract");
  }

  revalidatePath("/app/contracts");
  revalidatePath(`/app/clients/${clientId}`);
  redirect(`/app/contracts/${contractId}`);
}

export async function updateContractAction(
  contractId: string,
  _previousState: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const id = contractIdSchema.safeParse(contractId);
  const input = readContractInput(formData);

  if (!id.success) return { error: id.error.issues[0].message };
  if (!input.success) return invalidInputState(input.error);

  let clientId: string;
  try {
    const contract = await updateContract(id.data, input.data);
    clientId = contract.client_id;
  } catch (error) {
    return actionErrorState(error, "update_contract");
  }

  revalidatePath("/app/contracts");
  revalidatePath(`/app/contracts/${id.data}`);
  revalidatePath(`/app/clients/${clientId}`);
  redirect(`/app/contracts/${id.data}`);
}

export async function changeContractStatusAction(
  contractId: string,
  targetStatus: string,
): Promise<ContractActionState> {
  const input = z
    .object({ id: contractIdSchema, status: contractStatusSchema })
    .safeParse({ id: contractId, status: targetStatus });

  if (!input.success) return { error: "Ação de status inválida." };

  let clientId: string;
  try {
    const contract = await changeContractStatus(input.data.id, input.data.status);
    clientId = contract.client_id;
  } catch (error) {
    return actionErrorState(error, "change_contract_status");
  }

  revalidatePath("/app/contracts");
  revalidatePath(`/app/contracts/${input.data.id}`);
  revalidatePath(`/app/clients/${clientId}`);
  redirect(`/app/contracts/${input.data.id}`);
}
