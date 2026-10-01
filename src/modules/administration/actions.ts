"use server";

import { revalidatePath } from "next/cache";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import {
  inviteOrganizationUserSchema,
  membershipRoleInputSchema,
  membershipStatusInputSchema,
} from "./schemas/administration-schemas";
import {
  inviteOrganizationUser,
  resendOrganizationInvitation,
  changeOrganizationMemberRole,
  changeOrganizationMemberStatus,
} from "./services/organization-members";

export type AdministrationActionState = {
  error: string | null;
  success?: string;
};

export async function inviteOrganizationUserAction(
  _previousState: AdministrationActionState,
  formData: FormData,
): Promise<AdministrationActionState> {
  void _previousState;
  const input = inviteOrganizationUserSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Revise os dados do convite." };
  try {
    const { emailSent } = await inviteOrganizationUser(input.data);
    revalidatePath("/app/admin/users");
    revalidatePath("/app/admin/audit");
    return { error: null, success: emailSent
      ? "Usuário criado. Enviamos um código para ativar o acesso no e-mail informado."
      : "Usuário criado, mas o e-mail não foi enviado. Abra o usuário na lista para reenviar o convite." };
  } catch (error) {
    return actionErrorState(error, "invite_organization_user");
  }
}

export async function resendOrganizationInvitationAction(
  profileId: string,
  _previousState: AdministrationActionState,
): Promise<AdministrationActionState> {
  void _previousState;
  try {
    const sent = await resendOrganizationInvitation(profileId);
    return sent
      ? { error: null, success: "Novo código enviado para o e-mail do usuário." }
      : { error: "O e-mail não pôde ser enviado. Tente novamente." };
  } catch (error) {
    return actionErrorState(error, "resend_organization_invitation");
  }
}

function actionErrorState(error: unknown, operation: string): AdministrationActionState {
  if (!isAppError(error)) {
    logger.error({ event: "administration.action_failed", operation });
  }
  return { error: toPublicErrorMessage(error) };
}

export async function changeMembershipRoleAction(
  profileId: string,
  _previousState: AdministrationActionState,
  formData: FormData,
): Promise<AdministrationActionState> {
  const input = membershipRoleInputSchema.safeParse({
    profileId,
    role: formData.get("role"),
  });
  if (!input.success) return { error: "Papel informado é inválido." };

  try {
    await changeOrganizationMemberRole(input.data.profileId, input.data.role);
  } catch (error) {
    return actionErrorState(error, "change_membership_role");
  }

  revalidatePath("/app/admin/users");
  revalidatePath(`/app/admin/users/${input.data.profileId}`);
  revalidatePath("/app/admin/audit");
  return { error: null, success: "Papel atualizado." };
}

export async function changeMembershipStatusAction(
  profileId: string,
  targetStatus: string,
  _previousState: AdministrationActionState,
): Promise<AdministrationActionState> {
  void _previousState;
  const input = membershipStatusInputSchema.safeParse({
    profileId,
    status: targetStatus,
  });
  if (!input.success) return { error: "Status informado é inválido." };

  try {
    await changeOrganizationMemberStatus(input.data.profileId, input.data.status);
  } catch (error) {
    return actionErrorState(error, "change_membership_status");
  }

  revalidatePath("/app/admin/users");
  revalidatePath(`/app/admin/users/${input.data.profileId}`);
  revalidatePath("/app/admin/audit");
  return { error: null, success: "Status atualizado." };
}
