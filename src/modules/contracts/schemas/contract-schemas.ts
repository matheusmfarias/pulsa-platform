import { z } from "zod";

import { contractStatusSchema } from "../domain/contract";

const optionalTextSchema = z
  .string()
  .trim()
  .max(160, "Use no máximo 160 caracteres.")
  .transform((value) => value || null);

const optionalDateSchema = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(z.iso.date("Informe uma data válida.").nullable());

export const contractInputSchema = z
  .object({
    client_id: z.uuid("Selecione um cliente válido."),
    name: z
      .string()
      .trim()
      .min(2, "Informe pelo menos 2 caracteres.")
      .max(160, "Use no máximo 160 caracteres."),
    start_date: z.iso.date("Informe uma data inicial válida."),
    end_date: optionalDateSchema,
    external_reference: optionalTextSchema,
  })
  .refine(
    ({ start_date, end_date }) => !end_date || end_date >= start_date,
    {
      path: ["end_date"],
      message: "A data final não pode ser anterior à data inicial.",
    },
  );

export const contractIdSchema = z.uuid("Identificador de contrato inválido.");

export const contractListFiltersSchema = z.object({
  clientId: z.uuid().optional(),
  status: contractStatusSchema.optional(),
});

export type ContractInput = z.infer<typeof contractInputSchema>;
export type ContractListFilters = z.infer<typeof contractListFiltersSchema>;
