import { z } from "zod";

import type { Permission } from "@/modules/authorization";

export const ABSENCE_REASONS = [
  "sick",
  "medical_certificate",
  "personal",
  "no_show",
  "other",
] as const;

export const ABSENCE_STATUSES = ["reported", "cancelled"] as const;

export const absenceReasonSchema = z.enum(ABSENCE_REASONS);
export const absenceStatusSchema = z.enum(ABSENCE_STATUSES);

export const absenceSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  schedule_entry_id: z.uuid(),
  reason: absenceReasonSchema,
  notes: z.string().nullable(),
  status: absenceStatusSchema,
  reported_at: z.string(),
  reported_by: z.uuid(),
  created_at: z.string(),
});

export const absenceWithContextSchema = absenceSchema.extend({
  replacements: z.array(z.object({
    id: z.uuid(),
    status: z.enum(["active", "cancelled"]),
    replacement_assignment_id: z.uuid(),
    replacement_assignment: z.object({
      worker: z.object({ id: z.uuid(), full_name: z.string() }),
      position: z.object({ job_role: z.object({ id: z.uuid(), name: z.string() }), unit: z.object({ id: z.uuid(), name: z.string() }) }),
    }),
  })).optional(),
  reporter: z.object({
    id: z.uuid(),
    display_name: z.string().nullable(),
  }),
  schedule_entry: z.object({
    id: z.uuid(),
    schedule_revision_id: z.uuid(),
    assignment_id: z.uuid(),
    starts_at: z.string(),
    ends_at: z.string(),
    break_starts_at: z.string().nullable(),
    break_ends_at: z.string().nullable(),
    created_at: z.string(),
    created_by: z.uuid(),
    assignment: z.object({
      id: z.uuid(),
      worker: z.object({ id: z.uuid(), full_name: z.string() }),
      position: z.object({
        id: z.uuid(),
        job_role: z.object({ id: z.uuid(), name: z.string() }),
        unit: z.object({
          id: z.uuid(),
          name: z.string(),
          timezone: z.string(),
          operation: z.object({
            id: z.uuid(),
            name: z.string(),
            contract_id: z.uuid(),
          }),
        }),
      }),
    }),
    schedule_revision: z.object({
      id: z.uuid(),
      schedule: z.object({ id: z.uuid() }),
    }),
  }),
});

export type AbsenceReason = z.infer<typeof absenceReasonSchema>;
export type AbsenceStatus = z.infer<typeof absenceStatusSchema>;
export type Absence = z.infer<typeof absenceSchema>;
export type AbsenceWithContext = z.infer<typeof absenceWithContextSchema>;

export function isAbsenceWithoutCoverage(absence: AbsenceWithContext) {
  return absence.status === "reported" && !absence.replacements?.some((replacement) => replacement.status === "active");
}


export const ABSENCE_REASON_LABELS: Record<AbsenceReason, string> = {
  sick: "Doença",
  medical_certificate: "Atestado médico",
  personal: "Motivo pessoal",
  no_show: "Não comparecimento",
  other: "Outro",
};

export const ABSENCE_STATUS_LABELS: Record<AbsenceStatus, string> = {
  reported: "Registrada",
  cancelled: "Cancelada",
};

export type AbsenceAction = "register" | "view" | "cancel";

export function absenceActionsFor(
  status: AbsenceStatus | null,
  permissions: ReadonlySet<Permission>,
): AbsenceAction[] {
  if (status === "reported") {
    return permissions.has("absence:cancel") ? ["view", "cancel"] : ["view"];
  }
  return permissions.has("absence:create") ? ["register"] : [];
}
