import { z } from "zod";

import { assignmentStatusSchema } from "../domain/assignment";

const dateSchema = z
  .string({ error: "Informe uma data válida." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
    message: "Informe uma data válida.",
  });

const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  dateSchema.nullable(),
);

export const assignmentIdSchema = z.uuid("Alocação inválida.");

export const assignmentInputSchema = z
  .object({
    worker_id: z.uuid("Selecione um colaborador válido."),
position_id: z.uuid("Selecione um posto válido."),
    start_date: dateSchema,
    end_date: optionalDateSchema,
  })
  .refine(
    (value) => !value.end_date || value.end_date >= value.start_date,
    { path: ["end_date"], message: "A data final não pode anteceder a inicial." },
  );

export const assignmentListFiltersSchema = z.object({
  query: z.preprocess(
    (value) => Array.isArray(value) ? value[0] : value,
    z.string().trim().max(120).catch("").default(""),
  ),
  workerId: z.uuid().optional(),
  positionId: z.uuid().optional(),
  status: z.preprocess(
    (value) => (value === "" || value === "all" ? undefined : value),
    assignmentStatusSchema.optional(),
  ),
  pageSize: z.preprocess(
    (value) => {
      const parsed = Array.isArray(value) ? value[0] : value;
      return parsed == null ? undefined : String(parsed);
    },
    z.union([z.literal("10"), z.literal("25"), z.literal("50")]).transform(Number).catch(10).default(10),
  ),
});

export type AssignmentInput = z.infer<typeof assignmentInputSchema>;
export type AssignmentListFilters = z.infer<typeof assignmentListFiltersSchema>;
