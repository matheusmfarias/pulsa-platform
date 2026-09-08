import { z } from "zod";

import type { Permission } from "@/modules/authorization";

export const OPERATIONAL_PRESENCE_STATUSES = [
  "awaiting_confirmation",
  "uncovered_absence",
  "replacement_expected",
  "present",
  "completed",
] as const;

export const operationalPresenceStatusSchema = z.enum(
  OPERATIONAL_PRESENCE_STATUSES,
);

export const operationalPresenceRowSchema = z.object({
  schedule_entry_id: z.uuid(),
  schedule_id: z.uuid(),
  schedule_revision_id: z.uuid(),
  planned_assignment_id: z.uuid(),
  starts_at: z.string(),
  ends_at: z.string(),
  client_id: z.uuid(),
  client_name: z.string(),
  contract_id: z.uuid(),
  contract_name: z.string(),
  operation_id: z.uuid(),
  operation_name: z.string(),
  unit_id: z.uuid(),
  unit_name: z.string(),
  unit_timezone: z.string(),
  position_id: z.uuid(),
  job_role_id: z.uuid(),
  job_role_name: z.string(),
  original_worker_id: z.uuid(),
  original_worker_name: z.string(),
  absence_id: z.uuid().nullable(),
  absence_reason: z.string().nullable(),
  replacement_id: z.uuid().nullable(),
  replacement_assignment_id: z.uuid().nullable(),
  replacement_worker_id: z.uuid().nullable(),
  replacement_worker_name: z.string().nullable(),
  presence_id: z.uuid().nullable(),
  presence_status: z.enum(["present", "completed"]).nullable(),
  actual_assignment_id: z.uuid().nullable(),
  actual_worker_id: z.uuid().nullable(),
  actual_worker_name: z.string().nullable(),
  arrived_at: z.string().nullable(),
  departed_at: z.string().nullable(),
  operational_status: operationalPresenceStatusSchema,
  arrived_after_start: z.boolean(),
  departed_before_end: z.boolean(),
});

export const presenceOperationalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, "Informe uma data válida.");

export type OperationalPresenceStatus = z.infer<
  typeof operationalPresenceStatusSchema
>;
export type OperationalPresenceRow = z.infer<typeof operationalPresenceRowSchema>;

export type OperationalPresenceAction =
  | "start"
  | "complete"
  | "view"
  | "correct"
  | "cancel"
  | "define_coverage";

export function presenceActionsFor(
  row: Pick<OperationalPresenceRow, "operational_status" | "presence_id">,
  permissions: ReadonlySet<Permission>,
): OperationalPresenceAction[] {
  if (row.operational_status === "uncovered_absence") {
    return row.presence_id === null ? ["define_coverage"] : [];
  }

  const actions: OperationalPresenceAction[] = [];
  if (
    (row.operational_status === "awaiting_confirmation" ||
      row.operational_status === "replacement_expected") &&
    permissions.has("presence:create")
  ) {
    actions.push("start");
  }
  if (row.operational_status === "present" && permissions.has("presence:update")) {
    actions.push("complete");
  }
  if (row.presence_id) {
    actions.push("view");
    if (permissions.has("presence:update")) actions.push("correct");
    if (permissions.has("presence:cancel")) actions.push("cancel");
  }
  return actions;
}

export function summarizeOperationalPresences(rows: OperationalPresenceRow[]) {
  return {
    scheduled: rows.length,
    awaiting: rows.filter((row) =>
      ["awaiting_confirmation", "replacement_expected"].includes(
        row.operational_status,
      ),
    ).length,
    present: rows.filter((row) => row.operational_status === "present").length,
    completed: rows.filter((row) => row.operational_status === "completed").length,
    uncovered: rows.filter(
      (row) => row.operational_status === "uncovered_absence",
    ).length,
  };
}
