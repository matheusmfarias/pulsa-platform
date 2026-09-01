import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseClient, type Client } from "../domain/client";
import { updateClientRecord } from "../repositories/client-repository";
import type { ClientInput } from "../schemas/client-schemas";
import { throwRepositoryError } from "./repository-errors";

export async function updateClient(
  clientId: string,
  input: ClientInput,
): Promise<Client> {
  const { organizationId } = await requirePermission("client:update");
  const { data, error } = await updateClientRecord(
    organizationId,
    clientId,
    input,
  );

  if (error) {
    throwRepositoryError(
      error,
      "update_client",
      "Já existe um cliente com este documento na organização.",
    );
  }

  if (!data) {
    throw new AppError("NOT_FOUND", "Cliente não encontrado.");
  }

  return parseClient(data);
}
