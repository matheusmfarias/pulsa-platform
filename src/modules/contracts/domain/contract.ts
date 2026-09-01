import { z } from "zod";

import type { Tables } from "@/shared/db/database.types";

const contractClientStatusSchema = z.enum(["active", "inactive"]);
type ContractClientStatus = z.infer<typeof contractClientStatusSchema>;

export const contractStatusSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "ended",
  "cancelled",
]);

export type ContractStatus = z.infer<typeof contractStatusSchema>;
export type Contract = Omit<Tables<"contracts">, "status"> & {
  status: ContractStatus;
};
export type ContractClientSummary = {
  id: string;
  trade_name: string;
  status: ContractClientStatus;
};
export type ContractWithClient = Contract & {
  client: ContractClientSummary;
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  suspended: "Suspenso",
  ended: "Encerrado",
  cancelled: "Cancelado",
};

export const CONTRACT_STATUS_TRANSITIONS: Record<
  ContractStatus,
  readonly ContractStatus[]
> = {
  draft: ["active", "cancelled"],
  active: ["suspended", "ended", "cancelled"],
  suspended: ["active", "ended", "cancelled"],
  ended: [],
  cancelled: [],
};

export function canTransitionContractStatus(
  currentStatus: ContractStatus,
  targetStatus: ContractStatus,
): boolean {
  return CONTRACT_STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
}

export function parseContract(row: Tables<"contracts">): Contract {
  return {
    ...row,
    status: contractStatusSchema.parse(row.status),
  };
}

export function parseContractWithClient(
  row: Tables<"contracts"> & {
    client: { id: string; trade_name: string; status: string };
  },
): ContractWithClient {
  return {
    ...parseContract(row),
    client: {
      ...row.client,
      status: contractClientStatusSchema.parse(row.client.status),
    },
  };
}
