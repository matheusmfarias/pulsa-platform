import { AppError } from "@/shared/errors";

import type { WorkerAccessClaim } from "../domain/worker-access";
import {
  claimMyWorkerAccessRecord,
  claimWorkerAccessRecord,
  findMyPendingWorkerAccessClaimRecord,
  findWorkerAccessClaimRecord,
  getMyWorkerAccessHistoryStateRecord,
} from "../repositories/worker-access-repository";
import {
  workerAccessClaimRowSchema,
  workerAccessHistoryStateRowSchema,
  workerInvitationTokenSchema,
  workerAccessLinkRowSchema,
} from "../schemas/worker-access-schemas";
import { throwWorkerAccessRepositoryError } from "./repository-errors";

export async function getWorkerAccessClaim(
  invitationToken: unknown,
): Promise<WorkerAccessClaim | null> {
  const token = workerInvitationTokenSchema.safeParse(invitationToken);
  if (!token.success) return null;
  const { data, error } = await findWorkerAccessClaimRecord(token.data);
  if (error) throwWorkerAccessRepositoryError(error, "get_worker_access_claim");
  if (!data) return null;

  const parsed = workerAccessClaimRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("INFRASTRUCTURE", "Convite Worker inválido.");
  }
  return {
    workerName: parsed.data.worker_name,
    invitationEmail: parsed.data.invitation_email,
    expiresAt: parsed.data.expires_at,
  };
}

export async function claimWorkerAccess(invitationToken: unknown): Promise<void> {
  const token = workerInvitationTokenSchema.safeParse(invitationToken);
  if (!token.success) throw new AppError("AUTHORIZATION", "Convite inválido.");
  const { data, error } = await claimWorkerAccessRecord(token.data);
  if (error) throwWorkerAccessRepositoryError(error, "claim_worker_access");
  if (!workerAccessLinkRowSchema.safeParse(data).success) {
    throw new AppError("INFRASTRUCTURE", "Vínculo Worker inválido.");
  }
}

export async function getMyPendingWorkerAccessClaim(): Promise<WorkerAccessClaim | null> {
  const { data, error } = await findMyPendingWorkerAccessClaimRecord();
  if (error) {
    throwWorkerAccessRepositoryError(
      error,
      "get_my_pending_worker_access_claim",
    );
  }
  if (!data) return null;

  const parsed = workerAccessClaimRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("INFRASTRUCTURE", "Convite Worker inválido.");
  }
  return {
    workerName: parsed.data.worker_name,
    invitationEmail: parsed.data.invitation_email,
    expiresAt: parsed.data.expires_at,
  };
}

export async function claimMyWorkerAccess(): Promise<void> {
  const { data, error } = await claimMyWorkerAccessRecord();
  if (error) {
    throwWorkerAccessRepositoryError(error, "claim_my_worker_access");
  }
  if (!workerAccessLinkRowSchema.safeParse(data).success) {
    throw new AppError("INFRASTRUCTURE", "Vínculo Worker inválido.");
  }
}

export async function getMyWorkerAccessHistoryState(): Promise<boolean> {
  const { data, error } = await getMyWorkerAccessHistoryStateRecord();
  if (error) {
    throwWorkerAccessRepositoryError(
      error,
      "get_my_worker_access_history_state",
    );
  }

  const parsed = workerAccessHistoryStateRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("INFRASTRUCTURE", "Histórico de acesso Worker inválido.");
  }

  return parsed.data.has_prior_access;
}
