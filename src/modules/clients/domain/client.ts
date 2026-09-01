import { z } from "zod";

import type { Tables } from "@/shared/db/database.types";

export const clientStatusSchema = z.enum(["active", "inactive"]);

export type ClientStatus = z.infer<typeof clientStatusSchema>;
export type Client = Omit<Tables<"clients">, "status"> & {
  status: ClientStatus;
};

export function parseClient(row: Tables<"clients">): Client {
  return {
    ...row,
    status: clientStatusSchema.parse(row.status),
  };
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};
