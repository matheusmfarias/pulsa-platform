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

export type AssignmentListItem = Pick<
  Assignment,
  "id" | "start_date" | "end_date" | "status"
> & {
  worker: Pick<AssignmentWithContext["worker"], "id" | "full_name">;
  position: Pick<AssignmentWithContext["position"], "id"> & {
    job_role: Pick<AssignmentWithContext["position"]["job_role"], "name">;
    unit: Pick<AssignmentWithContext["position"]["unit"], "id" | "name">;
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

export function parseAssignmentListItem(
  row: Omit<AssignmentListItem, "status"> & { status: string },
): AssignmentListItem {
  return {
    id: row.id,
    start_date: row.start_date,
    end_date: row.end_date,
    status: assignmentStatusSchema.parse(row.status),
    worker: { id: row.worker.id, full_name: row.worker.full_name },
    position: {
      id: row.position.id,
      job_role: { name: row.position.job_role.name },
      unit: { id: row.position.unit.id, name: row.position.unit.name },
    },
  };
}
