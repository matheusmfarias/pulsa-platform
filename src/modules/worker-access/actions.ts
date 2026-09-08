"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { claimWorkerAccess } from "./services/claim-worker-access";
import {
  provisionWorkerAccess,
  resumeWorkerAccess,
  revokeWorkerAccess,
  revokeWorkerAccessInvitation,
  suspendWorkerAccess,
} from "./services/worker-access-administration";
import { requestWorkerOtp, verifyWorkerOtp } from "./services/worker-auth";
import { workerInvitationTokenSchema } from "./schemas/worker-access-schemas";

export type WorkerAccessActionState = {
  error: string | null;
  success?: string;
  email?: string;
  otpRequested?: boolean;
};

function actionError(error: unknown, operation: string): WorkerAccessActionState {
  if (!isAppError(error)) {
    logger.error({ event: "worker_access.action_failed", operation });
  }
  return { error: toPublicErrorMessage(error) };
}

export async function requestWorkerOtpAction(
  _previousState: WorkerAccessActionState,
  formData: FormData,
): Promise<WorkerAccessActionState> {
  const email = String(formData.get("email") ?? "");
  try {
    await requestWorkerOtp({ email });
    return {
      error: null,
      success: "Enviamos um código para o e-mail informado.",
      email: email.trim().toLowerCase(),
      otpRequested: true,
    };
  } catch (error) {
    return actionError(error, "request_worker_otp");
  }
}

export async function verifyWorkerOtpAction(
  _previousState: WorkerAccessActionState,
  formData: FormData,
): Promise<WorkerAccessActionState> {
  try {
    await verifyWorkerOtp({
      email: formData.get("email"),
      token: formData.get("token"),
    });
  } catch (error) {
    return actionError(error, "verify_worker_otp");
  }
  const invitation = workerInvitationTokenSchema.safeParse(
    formData.get("invitation"),
  );
  redirect(
    invitation.success
      ? `/worker/claim?invitation=${encodeURIComponent(invitation.data)}`
      : "/worker/claim",
  );
}

export async function claimWorkerAccessAction(
  invitationToken: string,
): Promise<void> {
  try {
    await claimWorkerAccess(invitationToken);
  } catch (error) {
    if (!isAppError(error)) {
      logger.error({ event: "worker_access.action_failed", operation: "claim" });
    }
    redirect(
      `/worker/claim?invitation=${encodeURIComponent(invitationToken)}&error=unavailable`,
    );
  }
  redirect("/worker");
}

export async function provisionWorkerAccessAction(
  workerId: string,
  _previousState: WorkerAccessActionState,
  formData: FormData,
): Promise<WorkerAccessActionState> {
  try {
    await provisionWorkerAccess({ workerId, email: formData.get("email") });
  } catch (error) {
    return actionError(error, "provision_worker_access");
  }
  revalidatePath(`/app/workers/${workerId}`);
  revalidatePath("/app/admin/audit");
  return { error: null, success: "Conta provisionada e convite enviado." };
}

export async function suspendWorkerAccessAction(
  workerId: string,
  _previousState: WorkerAccessActionState,
  formData: FormData,
): Promise<WorkerAccessActionState> {
  try {
    await suspendWorkerAccess({ workerId, reason: formData.get("reason") });
  } catch (error) {
    return actionError(error, "suspend_worker_access");
  }
  revalidatePath(`/app/workers/${workerId}`);
  revalidatePath("/app/admin/audit");
  return { error: null, success: "Acesso suspenso." };
}

export async function resumeWorkerAccessAction(
  workerId: string,
  _previousState: WorkerAccessActionState,
): Promise<WorkerAccessActionState> {
  void _previousState;
  try {
    await resumeWorkerAccess({ workerId });
  } catch (error) {
    return actionError(error, "resume_worker_access");
  }
  revalidatePath(`/app/workers/${workerId}`);
  revalidatePath("/app/admin/audit");
  return { error: null, success: "Acesso reativado." };
}

export async function revokeWorkerAccessAction(
  workerId: string,
  _previousState: WorkerAccessActionState,
  formData: FormData,
): Promise<WorkerAccessActionState> {
  try {
    await revokeWorkerAccess({ workerId, reason: formData.get("reason") });
  } catch (error) {
    return actionError(error, "revoke_worker_access");
  }
  revalidatePath(`/app/workers/${workerId}`);
  revalidatePath("/app/admin/audit");
  return { error: null, success: "Acesso revogado; o histórico foi preservado." };
}

export async function revokeWorkerInvitationAction(
  workerId: string,
  invitationId: string,
  _previousState: WorkerAccessActionState,
  formData: FormData,
): Promise<WorkerAccessActionState> {
  try {
    await revokeWorkerAccessInvitation({
      invitationId,
      reason: formData.get("reason"),
    });
  } catch (error) {
    return actionError(error, "revoke_worker_access_invitation");
  }
  revalidatePath(`/app/workers/${workerId}`);
  revalidatePath("/app/admin/audit");
  return { error: null, success: "Convite revogado." };
}
