import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const workerAppEnvironmentSchema = z.object({
  WORKER_APP_URL: z.url(),
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

const supabaseAdminEnvironmentSchema = publicEnvironmentSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type SupabaseAdminEnvironment = z.infer<
  typeof supabaseAdminEnvironmentSchema
>;

export function getPublicEnvironment(): PublicEnvironment {
  const result = publicEnvironmentSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw new Error(
      "Configuração do Supabase ausente ou inválida. Consulte .env.example.",
    );
  }

  return result.data;
}

export function getWorkerAppEnvironment() {
  const result = workerAppEnvironmentSchema.safeParse({
    WORKER_APP_URL: process.env.WORKER_APP_URL,
  });
  if (!result.success) {
    throw new Error("WORKER_APP_URL ausente ou inválida. Consulte .env.example.");
  }
  return result.data;
}

export function getSupabaseAdminEnvironment(): SupabaseAdminEnvironment {
  const result = supabaseAdminEnvironmentSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    throw new Error(
      "Configuração server-only do Supabase ausente ou inválida. Consulte .env.example.",
    );
  }

  return result.data;
}
