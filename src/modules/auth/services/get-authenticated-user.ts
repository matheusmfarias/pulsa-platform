import { logger } from "@/shared/logging";

import { findAuthenticatedUser } from "../repositories/supabase-auth-repository";
import type { AuthenticatedUser } from "../types/authenticated-user";

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const { user, errorCode } = await findAuthenticatedUser();

  if (!user && errorCode && errorCode !== "session_not_found") {
    logger.error({
      event: "authentication.user_lookup_failed",
      errorCode,
      operation: "get_user",
    });
  }

  return user;
}
