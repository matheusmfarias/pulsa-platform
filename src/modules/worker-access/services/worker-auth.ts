import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";
import { getWorkerAppEnvironment } from "@/shared/validation";

import {
  requestWorkerOtpRecord,
  requestWorkerPasswordResetRecord,
  verifyWorkerOtpRecord,
} from "../repositories/worker-access-repository";
import {
  requestWorkerOtpSchema,
  verifyWorkerOtpSchema,
} from "../schemas/worker-access-schemas";

export async function requestWorkerOtp(input: unknown): Promise<void> {
  const parsed = requestWorkerOtpSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "E-mail inválido.",
    );
  }

  const { WORKER_APP_URL } = getWorkerAppEnvironment();
  const signInUrl = new URL("/worker/sign-in", WORKER_APP_URL);
  const { error } = await requestWorkerOtpRecord(
    parsed.data.email,
    signInUrl.toString(),
  );
  if (error) {
    // Public behavior remains indistinguishable for existing and unknown e-mails.
    logger.error({
      event: "worker_access.otp_request_rejected",
      errorCode: error.code,
      operation: "sign_in_with_otp",
    });
  }
}

export async function requestWorkerPasswordReset(input: unknown): Promise<void> {
  const parsed = requestWorkerOtpSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "E-mail inválido.",
    );
  }

  const { WORKER_APP_URL } = getWorkerAppEnvironment();
  const resetUrl = new URL("/worker/reset-password", WORKER_APP_URL);
  const { error } = await requestWorkerPasswordResetRecord(
    parsed.data.email,
    resetUrl.toString(),
  );
  if (error) {
    // Recovery never reveals whether the account exists or can receive mail.
    logger.error({
      event: "worker_access.password_reset_rejected",
      errorCode: error.code,
      operation: "reset_password_for_email",
    });
  }
}

export async function verifyWorkerOtp(input: unknown): Promise<void> {
  const parsed = verifyWorkerOtpSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Código inválido.",
    );
  }

  const { error } = await verifyWorkerOtpRecord(
    parsed.data.email,
    parsed.data.token,
  );
  if (error) {
    throw new AppError(
      "AUTHORIZATION",
      "Código inválido ou expirado. Solicite um novo código.",
    );
  }
}
