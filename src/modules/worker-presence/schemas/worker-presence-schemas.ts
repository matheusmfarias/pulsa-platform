import { z } from "zod";

import { WORKER_PRESENCE_ACTIONS } from "../domain/worker-presence";

const uuidSchema = z.uuid();
const timestampSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Informe um horário válido.",
);

export const workerPresenceScheduleEntryIdSchema = uuidSchema;

export const workerPresenceActionSchema = z
  .enum(WORKER_PRESENCE_ACTIONS)
  .nullable();

export const workerPresenceResultSchema = z.object({
  schedule_entry_id: uuidSchema,
  status: z.enum(["present", "completed"]),
  arrived_at: timestampSchema,
  departed_at: timestampSchema.nullable(),
});

export const workerStartPresenceSchema = z.object({
  scheduleEntryId: uuidSchema,
  sourceReference: uuidSchema,
  idempotencyKey: uuidSchema,
});

export const workerCompletePresenceSchema = z.object({
  scheduleEntryId: uuidSchema,
  idempotencyKey: uuidSchema,
});

export const workerPresenceHistoryInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(30),
  beforeArrivedAt: timestampSchema.nullable().default(null),
  beforeScheduleEntryId: uuidSchema.nullable().default(null),
}).refine(
  ({ beforeArrivedAt, beforeScheduleEntryId }) =>
    (beforeArrivedAt === null) === (beforeScheduleEntryId === null),
  "Cursor de histórico inválido.",
);

export const workerPresenceHistoryRowSchema = z.object({
  schedule_entry_id: uuidSchema,
  presence_status: z.enum(["present", "completed"]),
  arrived_at: timestampSchema,
  departed_at: timestampSchema.nullable(),
  starts_at: timestampSchema,
  ends_at: timestampSchema,
  local_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  operation_name: z.string().min(1),
  unit_name: z.string().min(1),
  unit_timezone: z.string().min(1),
  job_role_name: z.string().min(1),
  worker_role: z.enum(["original", "replacement"]),
  arrived_after_start: z.boolean(),
  departed_before_end: z.boolean(),
});
