import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseClient, type Client, type ClientStatus } from "../domain/client";
import {
  findClientById,
  updateClientStatus,
} from "../repositories/client-repository";
import { throwRepositoryError } from "./repository-errors";

async function changeClientStatus(
  clientId: string,
  targetStatus: ClientStatus,
): Promise<Client> {
  const { organizationId } = await requirePermission("client:update");
  const currentResult = await findClientById(organizationId, clientId);

  if (currentResult.error) {
    throwRepositoryError(currentResult.error, "get_client_for_status_change");
  }

  if (!currentResult.data) {
    throw new AppError("NOT_FOUND", "Cliente não encontrado.");
  }

  const currentClient = parseClient(currentResult.data);

  if (currentClient.status === targetStatus) {
    throw new AppError(
      "CONFLICT",
      targetStatus === "active"
        ? "O cliente já está ativo."
        : "O cliente já está inativo.",
    );
  }

  const updateResult = await updateClientStatus(
    organizationId,
    clientId,
    currentClient.status,
    targetStatus,
  );

  if (updateResult.error) {
    throwRepositoryError(updateResult.error, "change_client_status");
  }

  if (!updateResult.data) {
    throw new AppError(
      "CONFLICT",
      "O estado do cliente mudou durante a operação. Atualize a página.",
    );
  }

  return parseClient(updateResult.data);
}

export async function activateClient(clientId: string): Promise<Client> {
  return changeClientStatus(clientId, "active");
}

export async function deactivateClient(clientId: string): Promise<Client> {
  return changeClientStatus(clientId, "inactive");
}
