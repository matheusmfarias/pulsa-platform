import { z } from "zod";

import type { Json } from "@/shared/db/database.types";

export const AUDIT_ENTITY_TYPES = [
  "client",
  "contract",
  "operation",
  "unit",
  "job_role",
  "position",
  "worker",
  "assignment",
  "organization_member",
] as const;

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "status_change",
  "membership_change",
] as const;

export const auditEntityTypeSchema = z.enum(AUDIT_ENTITY_TYPES);
export const auditActionSchema = z.enum(AUDIT_ACTIONS);

export type AuditEntityType = z.infer<typeof auditEntityTypeSchema>;
export type AuditAction = z.infer<typeof auditActionSchema>;

export type AuditEvent = {
  id: string;
  organization_id: string;
  actor_user_id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  metadata: Json;
  created_at: string;
  actor: { id: string; display_name: string | null } | null;
};

export type AuditEventDetail = AuditEvent & {
  organization: { id: string; trade_name: string } | null;
};

const actorSchema = z
  .object({ id: z.string().uuid(), display_name: z.string().nullable() })
  .nullable();

const auditEventSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  actor_user_id: z.string().uuid(),
  entity_type: auditEntityTypeSchema,
  entity_id: z.string().uuid(),
  action: auditActionSchema,
  metadata: z.custom<Json>(),
  created_at: z.string(),
  actor: actorSchema,
});

export function parseAuditEvent(value: unknown): AuditEvent {
  return auditEventSchema.parse(value);
}

export function parseAuditEventDetail(value: unknown): AuditEventDetail {
  return auditEventSchema
    .extend({
      organization: z
        .object({ id: z.string().uuid(), trade_name: z.string() })
        .nullable(),
    })
    .parse(value);
}

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  client: "Cliente",
  contract: "Contrato",
  operation: "Operação",
  unit: "Unidade",
  job_role: "Cargo",
  position: "Posto",
  worker: "Colaborador",
  assignment: "Alocação",
  organization_member: "Membership",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Criação",
  update: "Atualização",
  status_change: "Mudança de status",
  membership_change: "Mudança de membership",
};

export function readAuditMetadata(metadata: Json): {
  previousState: Record<string, Json | undefined>;
  newState: Record<string, Json | undefined>;
  changes: string[];
} {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    return { previousState: {}, newState: {}, changes: [] };
  }

  const previousState =
    metadata.previous_state &&
    !Array.isArray(metadata.previous_state) &&
    typeof metadata.previous_state === "object"
      ? metadata.previous_state
      : {};
  const newState =
    metadata.new_state &&
    !Array.isArray(metadata.new_state) &&
    typeof metadata.new_state === "object"
      ? metadata.new_state
      : {};
  const changes = Array.isArray(metadata.changes)
    ? metadata.changes.filter((item): item is string => typeof item === "string")
    : [];

  return { previousState, newState, changes };
}
