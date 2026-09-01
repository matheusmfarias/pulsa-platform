import { z } from "zod";

import { unitStatusSchema } from "../domain/unit";

function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Use no máximo ${maxLength} caracteres.`)
    .transform((value) => value || null);
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const unitInputSchema = z.object({
  operation_id: z.uuid("Selecione uma operação válida."),
  name: z
    .string()
    .trim()
    .min(2, "Informe pelo menos 2 caracteres.")
    .max(160, "Use no máximo 160 caracteres."),
  code: optionalText(64).transform((value) => value?.toUpperCase() ?? null),
  address: optionalText(300),
  city: optionalText(120),
  state: optionalText(80),
  timezone: z
    .string()
    .trim()
    .min(1, "Informe o timezone.")
    .max(100, "Use no máximo 100 caracteres.")
    .refine(isValidTimeZone, "Informe um timezone IANA válido."),
});

export const unitIdSchema = z.uuid("Identificador de unidade inválido.");
export const unitListFiltersSchema = z.object({
  operationId: z.uuid().optional(),
  status: unitStatusSchema.optional(),
});

export type UnitInput = z.infer<typeof unitInputSchema>;
export type UnitListFilters = z.infer<typeof unitListFiltersSchema>;
