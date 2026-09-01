import { requirePermission } from "@/modules/authorization";

import { parseClient, type Client } from "../domain/client";
import { insertClient } from "../repositories/client-repository";
import type { ClientInput } from "../schemas/client-schemas";
import { throwRepositoryError } from "./repository-errors";

const DUPLICATE_DOCUMENT_MESSAGE =
  "Já existe um cliente com este documento na organização.";

export async function createClient(input: ClientInput): Promise<Client> {
  const { organizationId } = await requirePermission("client:create");
  const { data, error } = await insertClient(organizationId, input);

  if (error) {
    throwRepositoryError(error, "create_client", DUPLICATE_DOCUMENT_MESSAGE);
  }

  return parseClient(data);
}
