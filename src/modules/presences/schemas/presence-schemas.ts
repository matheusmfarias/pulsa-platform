import { z } from "zod";

import { presenceSourceSchema } from "../domain/presence";

const timestampSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Informe um horário válido.",
);

const nullableTimestampSchema = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  timestampSchema.nullable(),
);

const sourceReferenceSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().min(1).max(500).nullable().optional(),
).transform((value) => value ?? null);

const commandSourceSchema = z
  .object({
    source: presenceSourceSchema.default("manual"),
    source_reference: sourceReferenceSchema,
  })
  .superRefine((value, context) => {
    if (value.source !== "manual" && value.source_reference === null) {
      context.addIssue({
        code: "custom",
        path: ["source_reference"],
        message: "Informe a referência da origem externa.",
      });
    }
  });

const idempotencySchema = z.object({
  idempotency_key: z.string().trim().min(1, "Informe a chave de idempotência.").max(200),
});

const reasonSchema = z.string().trim().min(1, "Informe a justificativa.").max(1000);

export const presenceIdSchema = z.uuid("Presença inválida.");
export const presenceScheduleEntryIdSchema = z.uuid("Entrada de escala inválida.");

export const startPresenceSchema = z
  .object({
    schedule_entry_id: presenceScheduleEntryIdSchema,
    arrived_at: timestampSchema,
  })
  .and(commandSourceSchema)
  .and(idempotencySchema);

export const completePresenceSchema = z
  .object({
    presence_id: presenceIdSchema,
    departed_at: timestampSchema,
  })
  .and(commandSourceSchema)
  .and(idempotencySchema);

export const correctPresenceSchema = z
  .object({
    presence_id: presenceIdSchema,
    arrived_at: timestampSchema,
    departed_at: nullableTimestampSchema,
    reason: reasonSchema,
  })
  .and(commandSourceSchema)
  .and(idempotencySchema)
  .superRefine((value, context) => {
    if (
      value.departed_at !== null &&
      Date.parse(value.departed_at) <= Date.parse(value.arrived_at)
    ) {
      context.addIssue({
        code: "custom",
        path: ["departed_at"],
        message: "A saída deve ser posterior à chegada.",
      });
    }
  });

export const cancelPresenceSchema = z
  .object({
    presence_id: presenceIdSchema,
    reason: reasonSchema,
  })
  .and(commandSourceSchema)
  .and(idempotencySchema);

export type StartPresenceInput = z.infer<typeof startPresenceSchema>;
export type CompletePresenceInput = z.infer<typeof completePresenceSchema>;
export type CorrectPresenceInput = z.infer<typeof correctPresenceSchema>;
export type CancelPresenceInput = z.infer<typeof cancelPresenceSchema>;

