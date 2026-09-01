import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseClient, type Client } from "../domain/client";
import { findClientById } from "../repositories/client-repository";
import { throwRepositoryError } from "./repository-errors";

export async function getClientById(clientId: string): Promise<Client> {
  const { organizationId } = await requirePermission("client:read");
  const { data, error } = await findClientById(organizationId, clientId);

  if (error) {
    throwRepositoryError(error, "get_client");
  }

  if (!data) {
    throw new AppError("NOT_FOUND", "Cliente não encontrado.");
  }

  return parseClient(data);
}
