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
  "schedule",
  "schedule_revision",
  "schedule_entry",
  "absence",
  "replacement",
  "presence",
  "worker_access_invitation",
  "worker_access_link",
] as const;

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "status_change",
  "membership_change",
  "submit",
  "approve",
  "return_to_draft",
  "publish",
  "create_from_published",
  "cancel",
  "record_arrival",
  "record_departure",
  "correct",
  "invite",
  "claim",
  "suspend",
  "resume",
  "revoke",
  "expire",
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
  organization_member: "Acesso à organização",
  schedule: "Escala",
  schedule_revision: "Revisão de escala",
  schedule_entry: "Jornada",
  absence: "Ausência",
  replacement: "Substituição",
  presence: "Presença",
  worker_access_invitation: "Convite Worker",
  worker_access_link: "Acesso Worker",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  status_change: "Mudança de status",
  membership_change: "Mudança de papel ou acesso",
  submit: "Envio para aprovação",
  approve: "Aprovação",
  return_to_draft: "Devolução para rascunho",
  publish: "Publicação",
  create_from_published: "Criação de revisão",
  cancel: "Cancelamento",
  record_arrival: "Registro de chegada",
  record_departure: "Registro de saída",
  correct: "Correção",
  invite: "Convite",
  claim: "Ativação",
  suspend: "Suspensão",
  resume: "Retomada",
  revoke: "Revogação",
  expire: "Expiração",
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
