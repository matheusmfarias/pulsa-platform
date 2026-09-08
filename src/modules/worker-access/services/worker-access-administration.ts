import { createHash, randomBytes } from "node:crypto";

import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";
import { getWorkerAppEnvironment } from "@/shared/validation";

import type { WorkerAccessAdministration } from "../domain/worker-access";
import { provisionWorkerAuthUser } from "../infrastructure/supabase-worker-auth-admin";
import {
  findWorkerAccessAdministrationRecord,
  inviteWorkerAccessRecord,
  requestWorkerOtpRecord,
  resumeWorkerAccessRecord,
  revokeWorkerAccessInvitationRecord,
  revokeWorkerAccessRecord,
  suspendWorkerAccessRecord,
} from "../repositories/worker-access-repository";
import {
  provisionWorkerAccessSchema,
  workerAccessAdministrationRowSchema,
  workerAccessInvitationRevocationSchema,
  workerAccessReasonSchema,
  workerAccessWorkerSchema,
} from "../schemas/worker-access-schemas";
import { throwWorkerAccessRepositoryError } from "./repository-errors";

export async function getWorkerAccessAdministration(
  workerId: string,
): Promise<WorkerAccessAdministration> {
  const { organizationId } = await requirePermission("worker_access:read");
  const { data, error } = await findWorkerAccessAdministrationRecord(
    organizationId,
    workerId,
  );
  if (error) {
    throwWorkerAccessRepositoryError(error, "get_worker_access_administration");
  }

  const parsed = workerAccessAdministrationRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("INFRASTRUCTURE", "Estado de acesso Worker inválido.");
  }
  return {
    linkId: parsed.data.link_id,
    linkStatus: parsed.data.link_status,
    linkProfileId: parsed.data.link_profile_id,
    invitationId: parsed.data.invitation_id,
    invitationStatus: parsed.data.invitation_status,
    invitationEmail: parsed.data.invitation_email,
    invitationExpiresAt: parsed.data.invitation_expires_at,
  };
}

export async function provisionWorkerAccess(input: unknown): Promise<void> {
  const { organizationId } = await requirePermission("worker_access:manage");
  const parsed = provisionWorkerAccessSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Revise os dados informados.",
    );
  }

  const { WORKER_APP_URL } = getWorkerAppEnvironment();

  let authUser: Awaited<ReturnType<typeof provisionWorkerAuthUser>>;
  try {
    authUser = await provisionWorkerAuthUser(parsed.data.email);
  } catch (error) {
    throw new AppError(
      "INFRASTRUCTURE",
      "Não foi possível provisionar a conta Auth.",
      { cause: error },
    );
  }

  const invitationToken = randomBytes(32).toString("hex");
  const invitationTokenHash = createHash("sha256")
    .update(invitationToken, "utf8")
    .digest("hex");

  const invitation = await inviteWorkerAccessRecord({
    organizationId,
    workerId: parsed.data.workerId,
    authUserId: authUser.userId,
    email: parsed.data.email,
    invitationTokenHash,
  });
  if (invitation.error) {
    throwWorkerAccessRepositoryError(invitation.error, "invite_worker_access");
  }

  const signInUrl = new URL("/worker/sign-in", WORKER_APP_URL);
  signInUrl.searchParams.set("invitation", invitationToken);
  const otp = await requestWorkerOtpRecord(parsed.data.email, signInUrl.toString());
  if (otp.error) {
    throw new AppError(
      "INFRASTRUCTURE",
      "O vínculo foi provisionado, mas o e-mail de acesso não pôde ser enviado.",
    );
  }
}

export async function suspendWorkerAccess(input: unknown): Promise<void> {
  const { organizationId } = await requirePermission("worker_access:manage");
  const parsed = workerAccessReasonSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const { error } = await suspendWorkerAccessRecord({
    organizationId,
    workerId: parsed.data.workerId,
    reason: parsed.data.reason,
  });
  if (error) throwWorkerAccessRepositoryError(error, "suspend_worker_access");
}

export async function resumeWorkerAccess(input: unknown): Promise<void> {
  const { organizationId } = await requirePermission("worker_access:manage");
  const parsed = workerAccessWorkerSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION", "Worker inválido.");
  const { error } = await resumeWorkerAccessRecord(
    organizationId,
    parsed.data.workerId,
  );
  if (error) throwWorkerAccessRepositoryError(error, "resume_worker_access");
}

export async function revokeWorkerAccess(input: unknown): Promise<void> {
  const { organizationId } = await requirePermission("worker_access:manage");
  const parsed = workerAccessReasonSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const { error } = await revokeWorkerAccessRecord({
    organizationId,
    workerId: parsed.data.workerId,
    reason: parsed.data.reason,
  });
  if (error) throwWorkerAccessRepositoryError(error, "revoke_worker_access");
}

export async function revokeWorkerAccessInvitation(input: unknown): Promise<void> {
  const { organizationId } = await requirePermission("worker_access:manage");
  const parsed = workerAccessInvitationRevocationSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const { error } = await revokeWorkerAccessInvitationRecord({
    organizationId,
    invitationId: parsed.data.invitationId,
    reason: parsed.data.reason,
  });
  if (error) {
    throwWorkerAccessRepositoryError(error, "revoke_worker_access_invitation");
  }
}
