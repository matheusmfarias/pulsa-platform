import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

import {
  requestWorkerOtpRecord,
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

  const { error } = await requestWorkerOtpRecord(parsed.data.email);
  if (error) {
    // Public behavior remains indistinguishable for existing and unknown e-mails.
    logger.error({
      event: "worker_access.otp_request_rejected",
      errorCode: error.code,
      operation: "sign_in_with_otp",
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
