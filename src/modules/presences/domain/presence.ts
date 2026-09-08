import { z } from "zod";

export const PRESENCE_STATUSES = ["present", "completed", "cancelled"] as const;
export const PRESENCE_SOURCES = ["manual", "app", "integration"] as const;

export const presenceStatusSchema = z.enum(PRESENCE_STATUSES);
export const presenceSourceSchema = z.enum(PRESENCE_SOURCES);

export const presenceSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  schedule_entry_id: z.uuid(),
  actual_assignment_id: z.uuid(),
  replacement_id: z.uuid().nullable(),
  status: presenceStatusSchema,
  arrived_at: z.string(),
  departed_at: z.string().nullable(),
  source: presenceSourceSchema,
  source_reference: z.string().nullable(),
  created_at: z.string(),
  created_by: z.uuid(),
  completed_at: z.string().nullable(),
  completed_by: z.uuid().nullable(),
  corrected_at: z.string().nullable(),
  corrected_by: z.uuid().nullable(),
  correction_reason: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.uuid().nullable(),
  cancellation_reason: z.string().nullable(),
});

export type PresenceStatus = z.infer<typeof presenceStatusSchema>;
export type PresenceSource = z.infer<typeof presenceSourceSchema>;
export type Presence = z.infer<typeof presenceSchema>;

