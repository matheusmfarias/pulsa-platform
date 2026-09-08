import { z } from "zod";

export const replacementIdSchema = z.uuid("Substituição inválida.");
export const absenceIdSchema = z.uuid("Ausência inválida.");
export const assignmentIdSchema = z.uuid("Colaborador inválido.");

export const createReplacementSchema = z.object({
  absence_id: absenceIdSchema,
  assignment_id: assignmentIdSchema,
});

export type CreateReplacementInput = z.infer<typeof createReplacementSchema>;
