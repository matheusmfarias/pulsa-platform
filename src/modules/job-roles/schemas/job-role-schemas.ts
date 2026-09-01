import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => value ?? "",
    z.string().trim().max(max).transform((value) => value || null),
  );

export const jobRoleIdSchema = z.uuid("Cargo inválido.");
export const jobRoleInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cargo.").max(160),
  description: optionalText(2000),
});
export const jobRoleListFiltersSchema = z.object({
  query: z.string().trim().max(100).catch(""),
  status: z.enum(["all", "active", "inactive"]).catch("all"),
});

export type JobRoleInput = z.infer<typeof jobRoleInputSchema>;
export type JobRoleListFilters = z.infer<typeof jobRoleListFiltersSchema>;
