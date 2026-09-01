import { z } from "zod";

import type { Tables } from "@/shared/db/database.types";

const unitOperationStatusSchema = z.enum([
  "planning",
  "implementation",
  "active",
  "suspended",
  "closing",
  "closed",
]);

export const unitStatusSchema = z.enum(["active", "inactive"]);
export type UnitStatus = z.infer<typeof unitStatusSchema>;
export type Unit = Omit<Tables<"units">, "status"> & { status: UnitStatus };
export type UnitWithContext = Unit & {
  operation: {
    id: string;
    name: string;
    status: z.infer<typeof unitOperationStatusSchema>;
    contract: {
      id: string;
      name: string;
      client: { id: string; trade_name: string };
    };
  };
};

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  active: "Ativa",
  inactive: "Inativa",
};

export function parseUnit(row: Tables<"units">): Unit {
  return { ...row, status: unitStatusSchema.parse(row.status) };
}

export function parseUnitWithContext(
  row: Tables<"units"> & {
    operation: {
      id: string;
      name: string;
      status: string;
      contract: {
        id: string;
        name: string;
        client: { id: string; trade_name: string };
      };
    };
  },
): UnitWithContext {
  return {
    ...parseUnit(row),
    operation: {
      ...row.operation,
      status: unitOperationStatusSchema.parse(row.operation.status),
    },
  };
}
