import { z } from "zod";

import type { Tables } from "@/shared/db/database.types";

const operationContractStatusSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "ended",
  "cancelled",
]);
const operationClientStatusSchema = z.enum(["active", "inactive"]);

export const operationStatusSchema = z.enum([
  "planning",
  "implementation",
  "active",
  "suspended",
  "closing",
  "closed",
]);

export type OperationStatus = z.infer<typeof operationStatusSchema>;
export type Operation = Omit<Tables<"operations">, "status"> & {
  status: OperationStatus;
};
export type OperationContext = {
  contract: {
    id: string;
    name: string;
    status: z.infer<typeof operationContractStatusSchema>;
    client: {
      id: string;
      trade_name: string;
      status: z.infer<typeof operationClientStatusSchema>;
    };
  };
};
export type OperationWithContext = Operation & OperationContext;

export const OPERATION_STATUS_LABELS: Record<OperationStatus, string> = {
  planning: "Planejamento",
  implementation: "Implantação",
  active: "Ativa",
  suspended: "Suspensa",
  closing: "Encerramento",
  closed: "Encerrada",
};

export const OPERATION_STATUS_TRANSITIONS: Record<
  OperationStatus,
  readonly OperationStatus[]
> = {
  planning: ["implementation"],
  implementation: ["active", "suspended"],
  active: ["suspended", "closing"],
  suspended: ["active", "closing"],
  closing: ["active", "closed"],
  closed: [],
};

export function canTransitionOperationStatus(
  currentStatus: OperationStatus,
  targetStatus: OperationStatus,
): boolean {
  return OPERATION_STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
}

export function parseOperation(row: Tables<"operations">): Operation {
  return {
    ...row,
    status: operationStatusSchema.parse(row.status),
  };
}

export function parseOperationWithContext(
  row: Tables<"operations"> & {
    contract: {
      id: string;
      name: string;
      status: string;
      client: {
        id: string;
        trade_name: string;
        status: string;
      };
    };
  },
): OperationWithContext {
  return {
    ...parseOperation(row),
    contract: {
      ...row.contract,
      status: operationContractStatusSchema.parse(row.contract.status),
      client: {
        ...row.contract.client,
        status: operationClientStatusSchema.parse(row.contract.client.status),
      },
    },
  };
}
