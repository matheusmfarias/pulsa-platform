import { createServerSupabaseClient } from "@/shared/db/supabase";

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
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { user: null, errorCode: error?.code };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
  };
}
