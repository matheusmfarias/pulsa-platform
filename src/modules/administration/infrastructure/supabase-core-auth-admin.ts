import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { Database } from "@/shared/db/database.types";
import { getSupabaseAdminEnvironment } from "@/shared/validation";

function createAdminClient(): SupabaseClient<Database> {
  const environment = getSupabaseAdminEnvironment();
  return createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } },
  );
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = createAdminClient();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.trim().toLowerCase() === email);
    if (user) return user;
    if (page >= data.lastPage) return null;
    page += 1;
  }
}

export async function createCoreAuthUser(email: string, organizationId: string): Promise<User> {
  const { data, error } = await createAdminClient().auth.admin.createUser({
    email,
    email_confirm: false,
    app_metadata: {
      pulsa_surface: "core",
      pulsa_invite_organization_id: organizationId,
    },
  });
  if (error) throw error;
  return data.user;
}

export async function deleteCoreAuthUser(userId: string): Promise<void> {
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function getAuthUserById(userId: string): Promise<User | null> {
  const { data, error } = await createAdminClient().auth.admin.getUserById(userId);
  if (error) {
    if (error.status === 404) return null;
    throw error;
  }
  return data.user;
}

export async function markCoreAuthUserActivated(userId: string, organizationId: string): Promise<void> {
  const user = await getAuthUserById(userId);
  if (user?.app_metadata?.pulsa_surface !== "core" ||
      user.app_metadata?.pulsa_invite_organization_id !== organizationId) {
    throw new Error("Core invitation identity mismatch");
  }
  if (user.app_metadata.pulsa_core_activated_at) return;
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
    app_metadata: { ...user.app_metadata, pulsa_core_activated_at: new Date().toISOString() },
  });
  if (error) throw error;
}
