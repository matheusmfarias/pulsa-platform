"use server";

import { redirect } from "next/navigation";

import { requireActiveOrganization } from "@/modules/organizations";
import { findAuthUserByEmail } from "@/modules/administration/infrastructure/supabase-core-auth-admin";
import { markCoreAuthUserActivated } from "@/modules/administration/infrastructure/supabase-core-auth-admin";
import { createServerSupabaseClient } from "@/shared/db/supabase";
import { getCoreAppEnvironment } from "@/shared/validation";

import { activationCodeSchema } from "./schemas/activation-schema";

export type ActivationActionState = { error: string | null; success?: string };

export async function verifyCoreActivationAction(
  _previous: ActivationActionState,
  formData: FormData,
): Promise<ActivationActionState> {
  const input = activationCodeSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Revise o código." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ ...input.data, type: "email" });
  if (error) return { error: "Código inválido ou expirado. Peça um novo convite à Direção." };
  try {
    await requireActiveOrganization();
  } catch {
    await supabase.auth.signOut();
    return { error: "Este e-mail não possui acesso ativo ao Pulsa Core." };
  }
  redirect("/activate/password");
}

export async function resendCoreActivationAction(
  _previous: ActivationActionState,
  formData: FormData,
): Promise<ActivationActionState> {
  const email = activationCodeSchema.shape.email.safeParse(formData.get("email"));
  if (!email.success) return { error: "Informe um e-mail válido." };
  try {
    const user = await findAuthUserByEmail(email.data);
    if (user && !user.app_metadata?.pulsa_core_activated_at && user.app_metadata?.pulsa_surface === "core") {
      const supabase = await createServerSupabaseClient();
      const { CORE_APP_URL } = getCoreAppEnvironment();
      await supabase.auth.signInWithOtp({
        email: email.data,
        options: { shouldCreateUser: false, emailRedirectTo: new URL("/activate", CORE_APP_URL).toString() },
      });
    }
  } catch {
    // Keep the public response generic so account existence is not disclosed.
  }
  return { error: null, success: "Se houver um convite para este e-mail, você receberá um novo código." };
}

export async function completeCoreActivationAction(): Promise<{ error: string | null }> {
  try {
    const context = await requireActiveOrganization();
    await markCoreAuthUserActivated(context.userId, context.organizationId);
    return { error: null };
  } catch {
    return { error: "A senha foi salva, mas não conseguimos concluir a ativação. Entre com seu e-mail e a nova senha." };
  }
}
