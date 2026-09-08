import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { Database } from "@/shared/db/database.types";
import { getSupabaseAdminEnvironment } from "@/shared/validation";

function createWorkerAuthAdminClient(): SupabaseClient<Database> {
  const environment = getSupabaseAdminEnvironment();

  return createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}

async function findAuthUserByEmail(
  admin: SupabaseClient<Database>,
  email: string,
): Promise<User | null> {
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    );
    if (match) return match;
    if (page >= data.lastPage) return null;
    page += 1;
  }
}

export async function provisionWorkerAuthUser(email: string): Promise<{
  userId: string;
  created: boolean;
}> {
  const admin = createWorkerAuthAdminClient();
  const existing = await findAuthUserByEmail(admin, email);
  if (existing) return { userId: existing.id, created: false };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: false,
    app_metadata: { pulsa_surface: "worker" },
  });
  if (error) throw error;

  return { userId: data.user.id, created: true };
}
