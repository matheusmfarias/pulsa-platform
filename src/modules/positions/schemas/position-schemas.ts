import { z } from "zod";
const optionalText = (max: number) =>
  z.preprocess(
    (value) => value ?? "",
    z.string().trim().max(max).transform((value) => value || null),
  );
export const positionIdSchema = z.string().uuid("Posição inválida.");
export const positionInputSchema = z.object({
  unit_id: z.string().uuid("Selecione uma unidade válida."),
  job_role_id: z.string().uuid("Selecione um cargo válido."),
  description: optionalText(2000),
  base_required_headcount: z.coerce
    .number()
    .int("Informe um número inteiro.")
    .min(0, "O efetivo não pode ser negativo."),
});
export const positionListFiltersSchema = z.object({
  unitId: z.string().uuid().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
export const positionGlobalListFiltersSchema = z.object({
  query: z.string().trim().max(120).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
export type PositionInput = z.infer<typeof positionInputSchema>;
export type PositionListFilters = z.infer<typeof positionListFiltersSchema>;
export type PositionGlobalListFilters = z.infer<typeof positionGlobalListFiltersSchema>;
