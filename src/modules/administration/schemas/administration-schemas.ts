import { z } from "zod";

import { organizationRoleSchema } from "@/modules/organizations";

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditActionSchema,
  auditEntityTypeSchema,
} from "../domain/audit-event";
import { membershipStatusSchema } from "../domain/organization-member";

export const profileIdSchema = z.string().uuid("Identificador de usuário inválido.");
export const auditEventIdSchema = z.string().uuid("Identificador de auditoria inválido.");
export const membershipRoleInputSchema = z.object({
  profileId: profileIdSchema,
  role: organizationRoleSchema,
});
export const membershipStatusInputSchema = z.object({
  profileId: profileIdSchema,
  status: membershipStatusSchema,
});

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);

function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
  return typeof value === "string" ? value : undefined;
}

export const auditListFiltersSchema = z
  .object({
    page: z.preprocess(
      firstString,
      z.coerce.number().int().min(1).max(10_000).default(1),
    ),
    from: z.preprocess(firstString, dateSchema),
    to: z.preprocess(firstString, dateSchema),
    entityType: z.preprocess(
      (value) => {
        const parsed = firstString(value);
        return parsed && (AUDIT_ENTITY_TYPES as readonly string[]).includes(parsed)
          ? parsed
          : undefined;
      },
      auditEntityTypeSchema.optional(),
    ),
    action: z.preprocess(
      (value) => {
        const parsed = firstString(value);
        return parsed && (AUDIT_ACTIONS as readonly string[]).includes(parsed)
          ? parsed
          : undefined;
      },
      auditActionSchema.optional(),
    ),
    actorId: z.preprocess(firstString, z.string().uuid().optional().catch(undefined)),
  })
  .refine((filters) => !filters.from || !filters.to || filters.from <= filters.to, {
    message: "O período inicial deve ser anterior ao período final.",
  });

export type AuditListFilters = z.infer<typeof auditListFiltersSchema>;

export const AUDIT_PAGE_SIZE = 50;
