import { z } from "zod";

import { isValidCpf, normalizeCpf } from "../domain/document-number";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => value ?? "",
    z.string().trim().max(max).transform((value) => value || null),
  );

const optionalDate = z.preprocess(
  (value) => value ?? "",
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Informe uma data válida.",
    )
    .transform((value) => value || null),
);

export const workerDocumentNumberSchema = z
  .string()
  .trim()
  .transform(normalizeCpf)
  .refine(isValidCpf, "Informe um CPF válido.");

export const workerInputSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Informe pelo menos 2 caracteres.")
      .max(160, "Use no máximo 160 caracteres."),
    document_number: workerDocumentNumberSchema,
    email: z.preprocess(
      (value) => value ?? "",
      z
        .string()
        .trim()
        .max(254)
        .refine(
          (value) => value === "" || z.email().safeParse(value).success,
          "Informe um e-mail válido.",
        )
        .transform((value) => value || null),
    ),
    phone: optionalText(30),
    engagement_start_date: optionalDate,
    engagement_end_date: optionalDate,
  })
  .superRefine((value, context) => {
    if (
      value.engagement_start_date &&
      value.engagement_end_date &&
      value.engagement_end_date < value.engagement_start_date
    ) {
      context.addIssue({
        code: "custom",
        path: ["engagement_end_date"],
        message: "A data final não pode ser anterior à data inicial.",
      });
    }
  });

export const workerIdSchema = z.uuid("Identificador de worker inválido.");
export const workerListFiltersSchema = z.object({
  query: z.string().trim().max(100).catch(""),
  status: z
    .enum(["all", "onboarding", "active", "inactive", "terminated"])
    .catch("all"),
});

export type WorkerInput = z.infer<typeof workerInputSchema>;
export type WorkerListFilters = z.infer<typeof workerListFiltersSchema>;
