import { z } from "zod";

import {
  WORKER_ACCESS_INVITATION_STATUSES,
  WORKER_ACCESS_LINK_STATUSES,
} from "../domain/worker-access";

export const provisionWorkerAccessSchema = z.object({
  workerId: z.uuid("Worker inválido."),
  email: z.email("Informe um e-mail válido.").transform((value) =>
    value.trim().toLowerCase(),
  ),
});

export const workerAccessReasonSchema = z.object({
  workerId: z.uuid("Worker inválido."),
  reason: z
    .string()
    .trim()
    .min(1, "Informe o motivo.")
    .max(1000, "O motivo deve ter no máximo 1000 caracteres."),
});

export const workerAccessWorkerSchema = z.object({
  workerId: z.uuid("Worker inválido."),
});

export const workerAccessInvitationRevocationSchema = z.object({
  invitationId: z.uuid("Convite inválido."),
  reason: z
    .string()
    .trim()
    .min(1, "Informe o motivo.")
    .max(1000, "O motivo deve ter no máximo 1000 caracteres."),
});

export const requestWorkerOtpSchema = z.object({
  email: z.email("Informe um e-mail válido.").transform((value) =>
    value.trim().toLowerCase(),
  ),
});

export const verifyWorkerOtpSchema = z.object({
  email: z.email("Informe um e-mail válido.").transform((value) =>
    value.trim().toLowerCase(),
  ),
  token: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "Informe o código de 8 dígitos."),
});

export const workerPasswordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.");

export const workerPasswordUpdateSchema = z
  .object({
    password: workerPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  });

export const workerInvitationTokenSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "Convite inválido.");

export const workerAccessContextRowSchema = z.object({
  user_id: z.uuid(),
  worker_id: z.uuid(),
  organization_id: z.uuid(),
  worker_name: z.string().min(1),
});

export const workerAccessClaimRowSchema = z.object({
  worker_name: z.string().min(1),
  invitation_email: z.string().min(1),
  expires_at: z.string().min(1),
});

export const workerAccessHistoryStateRowSchema = z.object({
  has_prior_access: z.boolean(),
});

export const workerAccessAdministrationRowSchema = z.object({
  link_id: z.uuid().nullable(),
  link_status: z.enum(WORKER_ACCESS_LINK_STATUSES).nullable(),
  link_profile_id: z.uuid().nullable(),
  invitation_id: z.uuid().nullable(),
  invitation_status: z.enum(WORKER_ACCESS_INVITATION_STATUSES).nullable(),
  invitation_email: z.string().nullable(),
  invitation_expires_at: z.string().nullable(),
});

export const workerAccessLinkRowSchema = z.object({
  id: z.uuid(),
  worker_id: z.uuid(),
  profile_id: z.uuid(),
  status: z.enum(WORKER_ACCESS_LINK_STATUSES),
});
