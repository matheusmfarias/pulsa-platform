import { z } from "zod";

export const REPLACEMENT_STATUSES = ["active", "cancelled"] as const;
export const replacementStatusSchema = z.enum(REPLACEMENT_STATUSES);

export const replacementSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  absence_id: z.uuid(),
  replacement_assignment_id: z.uuid(),
  status: replacementStatusSchema,
  created_at: z.string(),
  created_by: z.uuid(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.uuid().nullable(),
});

export const replacementCandidateSchema = z.object({
  assignment_id: z.uuid(),
  worker_id: z.uuid(),
  worker_full_name: z.string(),
});

export type Replacement = z.infer<typeof replacementSchema>;
export type ReplacementCandidate = z.infer<typeof replacementCandidateSchema>;
export type ReplacementStatus = z.infer<typeof replacementStatusSchema>;

export const REPLACEMENT_STATUS_LABELS: Record<ReplacementStatus, string> = {
  active: "Ativa",
  cancelled: "Cancelada",
};
