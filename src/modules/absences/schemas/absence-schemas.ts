import { z } from "zod";

import { absenceReasonSchema } from "../domain/absence";

export const absenceIdSchema = z.uuid("Ausência inválida.");
export const absenceScheduleEntryIdSchema = z.uuid("Entrada de escala inválida.");

export const createAbsenceSchema = z.object({
  schedule_entry_id: absenceScheduleEntryIdSchema,
  reason: absenceReasonSchema,
  notes: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(2000, "As observações devem ter no máximo 2000 caracteres.").nullable().optional(),
  ).transform((value) => value ?? null),
});

export type CreateAbsenceInput = z.infer<typeof createAbsenceSchema>;
