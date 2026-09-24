"use server";

import { redirect } from "next/navigation";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";
import { requireActiveOrganization } from "@/modules/organizations";
import { getAuthUserById, markCoreAuthUserActivated } from "@/modules/administration/infrastructure/supabase-core-auth-admin";

import { loginSchema } from "./schemas/login-schema";
import { authenticate } from "./services/authenticate";
import { signOut } from "./services/sign-out";

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const input = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!input.success) {
    return {
      error: input.error.issues[0]?.message ?? "Revise os dados informados.",
    };
  }

  try {
    await authenticate(input.data);
    try {
      const context = await requireActiveOrganization();
      const user = await getAuthUserById(context.userId);
      if (user?.app_metadata?.pulsa_surface === "core" && !user.app_metadata?.pulsa_core_activated_at) {
        await markCoreAuthUserActivated(context.userId, context.organizationId);
      }
    } catch {
      // Authentication remains available if invitation metadata cannot be refreshed.
      logger.error({ event: "authentication.activation_marker_failed" });
    }
  } catch (error) {
    if (!isAppError(error)) {
      logger.error({
        event: "authentication.unexpected_failure",
        operation: "password_sign_in",
      });
    }

    return { error: toPublicErrorMessage(error) };
  }

  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/");
}
