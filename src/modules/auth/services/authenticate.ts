import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { signInWithPassword } from "../repositories/supabase-auth-repository";
import type { LoginInput } from "../schemas/login-schema";

export async function authenticate(input: LoginInput): Promise<void> {
  const { error } = await signInWithPassword(input);

  if (error) {
    logger.info({
      event: "authentication.failed",
      errorCode: error.code,
      operation: "password_sign_in",
    });
    throw new AppError("VALIDATION", "E-mail ou senha inválidos.");
  }
}
