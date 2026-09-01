import { logger } from "@/shared/logging";

import { signOutCurrentSession } from "../repositories/supabase-auth-repository";

export async function signOut(): Promise<void> {
  const { error } = await signOutCurrentSession();

  if (error) {
    logger.error({
      event: "authentication.sign_out_failed",
      errorCode: error.code,
      operation: "local_sign_out",
    });
  }
}
