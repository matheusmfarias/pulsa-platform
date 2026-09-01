import { z } from "zod";

import { operationStatusSchema } from "../domain/operation";

const optionalTextSchema = z
  .string()
  .trim()
  .max(2000, "Use no máximo 2000 caracteres.")
  .transform((value) => value || null);

const optionalDateSchema = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(z.iso.date("Informe uma data válida.").nullable());

const optionalManagerSchema = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(z.uuid("Informe um identificador de gestor válido.").nullable());

export const operationInputSchema = z
  .object({
    contract_id: z.uuid("Selecione um contrato válido."),
    name: z
      .string()
      .trim()
      .min(2, "Informe pelo menos 2 caracteres.")
      .max(160, "Use no máximo 160 caracteres."),
    description: optionalTextSchema,
    start_date: z.iso.date("Informe uma data inicial válida."),
    end_date: optionalDateSchema,
    manager_user_id: optionalManagerSchema,
  })
  .refine(
    ({ start_date, end_date }) => !end_date || end_date >= start_date,
    {
      path: ["end_date"],
      message: "A data final não pode ser anterior à data inicial.",
    },
  );

export const operationIdSchema = z.uuid("Identificador de operação inválido.");

export const operationListFiltersSchema = z.object({
  contractId: z.uuid().optional(),
  status: operationStatusSchema.optional(),
});

export type OperationInput = z.infer<typeof operationInputSchema>;
export type OperationListFilters = z.infer<typeof operationListFiltersSchema>;
