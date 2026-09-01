import { requirePermission } from "@/modules/authorization";

import { parseClient, type Client } from "../domain/client";
import { findClients } from "../repositories/client-repository";
import type { ClientListFilters } from "../schemas/client-schemas";
import { throwRepositoryError } from "./repository-errors";

export async function listClients(filters: ClientListFilters): Promise<Client[]> {
  const { organizationId } = await requirePermission("client:read");
  const { data, error } = await findClients(organizationId, filters);

  if (error) {
    throwRepositoryError(error, "list_clients");
  }

  return data.map(parseClient);
}
