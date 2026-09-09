"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signOut } from "@/modules/auth/services/sign-out";
import { loginSchema } from "@/modules/auth/schemas/login-schema";
import { authenticate } from "@/modules/auth/services/authenticate";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import {
  claimMyWorkerAccess,
  claimWorkerAccess,
  getMyWorkerAccessHistoryState,
} from "./services/claim-worker-access";
import { getWorkerClaimExperience } from "./domain/worker-access";
import {
  provisionWorkerAccess,
  resumeWorkerAccess,
  revokeWorkerAccess,
  revokeWorkerAccessInvitation,
  suspendWorkerAccess,
} from "./services/worker-access-administration";
import {
  requestWorkerOtp,
  requestWorkerPasswordReset,
  verifyWorkerOtp,
} from "./services/worker-auth";
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

export async function workerPasswordSignInAction(
  _previousState: WorkerAccessActionState,
  formData: FormData,
): Promise<WorkerAccessActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revise os dados informados.",
    };
  }

  try {
    await authenticate(parsed.data);
  } catch (error) {
    return actionError(error, "worker_password_sign_in");
  }
  redirect("/worker");
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

export async function requestWorkerPasswordResetAction(
  _previousState: WorkerAccessActionState,
  formData: FormData,
): Promise<WorkerAccessActionState> {
  try {
    await requestWorkerPasswordReset({ email: formData.get("email") });
  } catch (error) {
    if (isAppError(error) && error.code === "VALIDATION") {
      return { error: error.message };
    }
    // The public response remains the same for missing users and provider errors.
    if (!isAppError(error)) {
      logger.error({
        event: "worker_access.action_failed",
        operation: "request_password_reset",
      });
    }
  }
  return {
    error: null,
    success: "Se houver uma conta para este e-mail, enviaremos as instruções.",
  };
}

export async function claimWorkerAccessAction(
  invitationToken: string,
): Promise<void> {
  let hasPriorAccess: boolean;
  try {
    hasPriorAccess = await getMyWorkerAccessHistoryState();
    await claimWorkerAccess(invitationToken);
  } catch (error) {
    if (!isAppError(error)) {
      logger.error({ event: "worker_access.action_failed", operation: "claim" });
    }
    redirect(
      `/worker/claim?invitation=${encodeURIComponent(invitationToken)}&error=unavailable`,
    );
  }
  redirect(getWorkerClaimExperience(hasPriorAccess).redirectTo);
}

export async function claimMyWorkerAccessAction(): Promise<void> {
  let hasPriorAccess: boolean;
  try {
    hasPriorAccess = await getMyWorkerAccessHistoryState();
    await claimMyWorkerAccess();
  } catch (error) {
    if (!isAppError(error)) {
      logger.error({
        event: "worker_access.action_failed",
        operation: "claim_my_worker_access",
      });
    }
    redirect("/worker/claim?error=unavailable");
  }
  redirect(getWorkerClaimExperience(hasPriorAccess).redirectTo);
}

export async function workerLogoutAction(): Promise<void> {
  await signOut();
  redirect("/worker/sign-in");
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
