"use server";

import { revalidatePath } from "next/cache";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import {
  membershipRoleInputSchema,
  membershipStatusInputSchema,
} from "./schemas/administration-schemas";
import {
  changeOrganizationMemberRole,
  changeOrganizationMemberStatus,
} from "./services/organization-members";

export type AdministrationActionState = {
  error: string | null;
  success?: string;
};

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
