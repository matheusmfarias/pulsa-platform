"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { clientIdSchema, clientInputSchema } from "./schemas/client-schemas";
import { activateClient, deactivateClient } from "./services/change-client-status";
import { createClient } from "./services/create-client";
import { updateClient } from "./services/update-client";

export type ClientActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<"legal_name" | "trade_name" | "document_number", string[]>>;
};

function invalidInputState(error: z.ZodError): ClientActionState {
  return {
    error: "Revise os campos informados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function actionErrorState(error: unknown, operation: string): ClientActionState {
  if (!isAppError(error)) {
    logger.error({ event: "clients.action_failed", operation });
  }

  return { error: toPublicErrorMessage(error) };
}

function readClientInput(formData: FormData) {
  return clientInputSchema.safeParse({
    legal_name: formData.get("legal_name"),
    trade_name: formData.get("trade_name"),
    document_number: formData.get("document_number"),
  });
}

export async function createClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const input = readClientInput(formData);
  if (!input.success) return invalidInputState(input.error);

  let clientId: string;
  try {
    const client = await createClient(input.data);
    clientId = client.id;
  } catch (error) {
    return actionErrorState(error, "create_client");
  }

  revalidatePath("/app/clients");
  redirect(`/app/clients/${clientId}`);
}

export async function updateClientAction(
  clientId: string,
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const id = clientIdSchema.safeParse(clientId);
  const input = readClientInput(formData);

  if (!id.success) return { error: id.error.issues[0].message };
  if (!input.success) return invalidInputState(input.error);

  try {
    await updateClient(id.data, input.data);
  } catch (error) {
    return actionErrorState(error, "update_client");
  }

  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${id.data}`);
  redirect(`/app/clients/${id.data}`);
}

export async function changeClientStatusAction(
  clientId: string,
  targetStatus: string,
): Promise<ClientActionState> {
  const input = z
    .object({ id: clientIdSchema, status: z.enum(["active", "inactive"]) })
    .safeParse({ id: clientId, status: targetStatus });

  if (!input.success) return { error: "Ação de status inválida." };

  try {
    if (input.data.status === "active") {
      await activateClient(input.data.id);
    } else {
      await deactivateClient(input.data.id);
    }
  } catch (error) {
    return actionErrorState(error, "change_client_status");
  }

  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${input.data.id}`);
  redirect(`/app/clients/${input.data.id}`);
}
