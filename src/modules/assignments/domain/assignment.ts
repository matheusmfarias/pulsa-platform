import { z } from "zod";

import type { Tables } from "@/shared/db/database.types";

export const assignmentStatusSchema = z.enum([
  "pending",
  "active",
  "suspended",
  "finished",
  "cancelled",
]);

export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;
export type Assignment = Omit<Tables<"assignments">, "status"> & {
  status: AssignmentStatus;
};

export type AssignmentWithContext = Assignment & {
  worker: {
    id: string;
    full_name: string;
    status: string;
    organization_id: string;
  };
  position: {
    id: string;
    status: string;
    job_role: { id: string; name: string };
    unit: {
      id: string;
      name: string;
      timezone: string;
      operation: {
        id: string;
        name: string;
        contract: {
          id: string;
          name: string;
          client: { id: string; trade_name: string; organization_id: string };
        };
      };
    };
  };
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: "Pendente",
  active: "Ativa",
  suspended: "Suspensa",
  finished: "Finalizada",
  cancelled: "Cancelada",
};

export const ASSIGNMENT_STATUS_TRANSITIONS: Record<
  AssignmentStatus,
  readonly AssignmentStatus[]
> = {
  pending: ["active", "cancelled"],
  active: ["suspended", "finished"],
  suspended: ["active", "finished", "cancelled"],
  finished: [],
  cancelled: [],
};

export function canTransitionAssignmentStatus(
  currentStatus: AssignmentStatus,
  targetStatus: AssignmentStatus,
): boolean {
  return ASSIGNMENT_STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
}

export function parseAssignment(row: Tables<"assignments">): Assignment {
  return { ...row, status: assignmentStatusSchema.parse(row.status) };
}

export function parseAssignmentWithContext(
  row: Tables<"assignments"> & Omit<AssignmentWithContext, keyof Assignment>,
): AssignmentWithContext {
  return { ...row, status: assignmentStatusSchema.parse(row.status) };
}
