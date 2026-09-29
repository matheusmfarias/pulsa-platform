"use server";

import { redirect } from "next/navigation";

import { requireActiveOrganization } from "@/modules/organizations";
import { findAuthUserByEmail } from "@/modules/administration/infrastructure/supabase-core-auth-admin";
import { markCoreAuthUserActivated } from "@/modules/administration/infrastructure/supabase-core-auth-admin";
import { createServerSupabaseClient } from "@/shared/db/supabase";
import { getCoreAppEnvironment, getPublicEnvironment } from "@/shared/validation";

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
  const invitationLink = String(formData.get("invitationLink") ?? "").trim();
  const email = activationCodeSchema.shape.email.safeParse(formData.get("email"));
  if (!email.success) return { error: "Informe um e-mail válido." };
  if (!invitationLink && !input.success) {
    return { error: input.error.issues[0]?.message ?? "Revise o código." };
  }
  const supabase = await createServerSupabaseClient();
  let verification;
  if (invitationLink) {
    let link: URL;
    try {
      link = new URL(invitationLink);
    } catch {
      return { error: "Cole o link completo recebido por e-mail." };
    }
    const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnvironment();
    const tokenHash = link.searchParams.get("token");
    const type = link.searchParams.get("type");
    if (
      link.origin !== new URL(NEXT_PUBLIC_SUPABASE_URL).origin ||
      link.pathname !== "/auth/v1/verify" ||
      !tokenHash ||
      (type !== "signup" && type !== "invite" && type !== "magiclink")
    ) {
      return { error: "Este link não é um convite válido deste ambiente." };
    }
    verification = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  } else {
    verification = await supabase.auth.verifyOtp({ ...input.data!, type: "email" });
  }
  if (verification.error) return { error: "Convite inválido ou expirado. Peça um novo convite à Direção." };
  if (verification.data.user?.email?.toLowerCase() !== email.data) {
    await supabase.auth.signOut();
    return { error: "O e-mail informado não corresponde ao convite." };
  }
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
