import { z } from "zod";
import type { Tables } from "@/shared/db/database.types";

export const positionStatusSchema = z.enum(["active", "inactive"]);
export type PositionStatus = z.infer<typeof positionStatusSchema>;
export type Position = Omit<Tables<"positions">, "status"> & {
  status: PositionStatus;
};
export type PositionWithContext = Position & {
  job_role: {
    id: string;
    name: string;
    status: "active" | "inactive";
  };
  unit: {
    id: string;
    name: string;
    status: "active" | "inactive";
    operation: { id: string; name: string };
  };
};

export type PositionGlobalListItem = Position & {
  job_role: { id: string; name: string };
  unit: {
    id: string;
    name: string;
    operation: {
      id: string;
      name: string;
      contract: {
        id: string;
        client: { id: string; trade_name: string };
      };
    };
  };
  assignments: Array<{ status: string }>;
};
export const POSITION_STATUS_LABELS: Record<PositionStatus, string> = {
  active: "Ativa",
  inactive: "Inativa",
};
export function parsePosition(row: Tables<"positions">): Position {
  return { ...row, status: positionStatusSchema.parse(row.status) };
}
export function parsePositionWithContext(
  row: Tables<"positions"> & {
    job_role: { id: string; name: string; status: string };
    unit: {
      id: string;
      name: string;
      status: string;
      operation: { id: string; name: string };
    };
  },
): PositionWithContext {
  return {
    ...parsePosition(row),
    job_role: {
      ...row.job_role,
      status: z.enum(["active", "inactive"]).parse(row.job_role.status),
    },
    unit: {
      ...row.unit,
      status: z.enum(["active", "inactive"]).parse(row.unit.status),
    },
  };
}

export function parsePositionGlobalListItem(
  row: Tables<"positions"> & Omit<PositionGlobalListItem, keyof Position>,
): PositionGlobalListItem {
  return {
    ...parsePosition(row),
    job_role: row.job_role,
    unit: row.unit,
    assignments: row.assignments ?? [],
  };
}
