import { z } from "zod";

import { WORKER_JOURNEY_STATUSES } from "../domain/worker-schedule";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const workerScheduleAnchorDateSchema = isoDateSchema.nullable();

export const workerScheduleRangeSchema = z
  .object({ fromDate: isoDateSchema, toDate: isoDateSchema })
  .refine(
    ({ fromDate, toDate }) => {
      const from = new Date(`${fromDate}T00:00:00Z`);
      const to = new Date(`${toDate}T00:00:00Z`);
      const days = (to.getTime() - from.getTime()) / 86_400_000;
      return Number.isInteger(days) && days >= 0 && days <= 30;
    },
    "O período deve conter no máximo 31 dias.",
  );

export const workerScheduleEntryIdSchema = z.uuid("Jornada inválida.");

export const workerScheduleRowSchema = z.object({
  schedule_entry_id: z.uuid(),
  starts_at: z.string(),
  ends_at: z.string(),
  break_starts_at: z.string().nullable(),
  break_ends_at: z.string().nullable(),
  local_date: isoDateSchema,
  operation_name: z.string().min(1),
  unit_name: z.string().min(1),
  unit_timezone: z.string().min(1),
  unit_address: z.string().nullable(),
  unit_city: z.string().nullable(),
  unit_state: z.string().nullable(),
  job_role_name: z.string().min(1),
  journey_status: z.enum(WORKER_JOURNEY_STATUSES),
  presence_status: z.enum(["present", "completed"]).nullable(),
  arrived_at: z.string().nullable(),
  departed_at: z.string().nullable(),
  schedule_version: z.number().int().positive(),
  published_at: z.string(),
  was_republished: z.boolean(),
});

export const workerHomeRowSchema = workerScheduleRowSchema.extend({
  home_slot: z.enum(["current", "today", "next"]),
});
