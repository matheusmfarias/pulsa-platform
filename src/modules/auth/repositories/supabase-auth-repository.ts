import { createServerSupabaseClient } from "@/shared/db/supabase";
import { measureServerStage } from "@/shared/logging";

import type { LoginInput } from "../schemas/login-schema";
import type { AuthenticatedUser } from "../types/authenticated-user";

export async function signInWithPassword(input: LoginInput) {
  const supabase = await createServerSupabaseClient();
  return supabase.auth.signInWithPassword(input);
}

export async function signOutCurrentSession() {
  const supabase = await createServerSupabaseClient();
  return supabase.auth.signOut({ scope: "local" });
}

export async function findAuthenticatedUser(): Promise<{
  user: AuthenticatedUser | null;
  errorCode?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await measureServerStage("auth.server.get_claims", () =>
    supabase.auth.getClaims(),
  );

  const claims = data?.claims;
  if (error || !claims?.sub) {
    return { user: null, errorCode: error?.code };
  }

  return {
    user: {
      id: claims.sub,
      email: claims.email ?? null,
    },
  };
}
