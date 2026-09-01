import { z } from "zod";

import { isValidCnpj, normalizeDocumentNumber } from "../domain/document-number";

const companyNameSchema = z
  .string()
  .trim()
  .min(2, "Informe pelo menos 2 caracteres.")
  .max(160, "Use no máximo 160 caracteres.");

export const documentNumberSchema = z
  .string()
  .trim()
  .transform(normalizeDocumentNumber)
  .refine(isValidCnpj, "Informe um CNPJ válido.");

export const clientInputSchema = z.object({
  legal_name: companyNameSchema,
  trade_name: companyNameSchema,
  document_number: documentNumberSchema,
});

export const clientIdSchema = z.uuid("Identificador de cliente inválido.");

export const clientListFiltersSchema = z.object({
  query: z.string().trim().max(100).catch(""),
  status: z.enum(["all", "active", "inactive"]).catch("all"),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
export type ClientListFilters = z.infer<typeof clientListFiltersSchema>;
