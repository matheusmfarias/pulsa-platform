import { requirePermission } from "@/modules/authorization";
import type { OrganizationRole } from "@/modules/organizations";
import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";
import { getCoreAppEnvironment } from "@/shared/validation";

import {
  parseOrganizationMember,
  type MembershipStatus,
  type OrganizationMember,
} from "../domain/organization-member";
import {
  createOrganizationMembership,
  findOrganizationMemberById,
  findOrganizationMembers,
  mutateOrganizationMembership,
} from "../repositories/administration-repository";
import {
  createCoreAuthUser,
  deleteCoreAuthUser,
  findAuthUserByEmail,
  getAuthUserById,
} from "../infrastructure/supabase-core-auth-admin";
import { inviteOrganizationUserSchema } from "../schemas/administration-schemas";
import { createServerSupabaseClient } from "@/shared/db/supabase";
import { throwAdministrationRepositoryError } from "./repository-errors";

export type OrganizationMemberWithAuth = OrganizationMember & {
  email: string | null;
  invitationPending: boolean;
};

async function withAuthDetails(member: OrganizationMember): Promise<OrganizationMemberWithAuth> {
  const user = await getAuthUserById(member.profile_id);
  return {
    ...member,
    email: user?.email ?? null,
    invitationPending: Boolean(user && user.app_metadata?.pulsa_surface === "core" && !user.app_metadata?.pulsa_core_activated_at),
  };
}

export async function listOrganizationMembers(): Promise<OrganizationMemberWithAuth[]> {
  const { organizationId } = await requirePermission("organization_member:read");
  const { data, error } = await findOrganizationMembers(organizationId);
  if (error) throwAdministrationRepositoryError(error, "list_organization_members");
  return Promise.all(data.map((row) => withAuthDetails(parseOrganizationMember(row))));
}

export async function getOrganizationMemberById(
  profileId: string,
): Promise<OrganizationMemberWithAuth> {
  const { organizationId } = await requirePermission("organization_member:read");
  const { data, error } = await findOrganizationMemberById(organizationId, profileId);
  if (error) throwAdministrationRepositoryError(error, "get_organization_member");
  if (!data) throw new AppError("NOT_FOUND", "Membership não encontrada.");
  return withAuthDetails(parseOrganizationMember(data));
}

async function sendCoreInvitation(email: string): Promise<boolean> {
  const { CORE_APP_URL } = getCoreAppEnvironment();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: new URL("/activate", CORE_APP_URL).toString(),
    },
  });
  if (error) logger.error({ event: "administration.invitation_email_failed", errorCode: error.code });
  return !error;
}

export async function inviteOrganizationUser(input: unknown): Promise<{ emailSent: boolean }> {
  const { organizationId } = await requirePermission("organization_member:update");
  const parsed = inviteOrganizationUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Revise os dados do convite.");
  }
  const { displayName, email, role } = parsed.data;
  let existing;
  try {
    existing = await findAuthUserByEmail(email);
  } catch (error) {
    throw new AppError("INFRASTRUCTURE", "Falha ao consultar contas existentes.", { cause: error });
  }
  if (existing) {
    throw new AppError("CONFLICT", "Este e-mail já possui uma conta. Consulte o suporte para vincular uma conta existente.");
  }

  let user;
  try {
    user = await createCoreAuthUser(email, organizationId);
  } catch (error) {
    throw new AppError("INFRASTRUCTURE", "Falha ao criar a conta de acesso.", { cause: error });
  }
  const { error } = await createOrganizationMembership(organizationId, user.id, displayName, role);
  if (error) {
    const lookup = await findOrganizationMemberById(organizationId, user.id);
    if (!lookup.error && lookup.data) return { emailSent: await sendCoreInvitation(email) };
    if (!lookup.error && !lookup.data) {
      try {
        await deleteCoreAuthUser(user.id);
      } catch {
        logger.error({ event: "administration.auth_cleanup_failed" });
      }
    }
    throwAdministrationRepositoryError(error, "create_organization_membership");
  }
  return { emailSent: await sendCoreInvitation(email) };
}

export async function resendOrganizationInvitation(profileId: string): Promise<boolean> {
  const { organizationId } = await requirePermission("organization_member:update");
  const { data, error } = await findOrganizationMemberById(organizationId, profileId);
  if (error) throwAdministrationRepositoryError(error, "find_membership_for_invitation");
  if (!data) throw new AppError("NOT_FOUND", "Usuário não encontrado nesta organização.");
  const member = parseOrganizationMember(data);
  if (member.status !== "active") throw new AppError("CONFLICT", "Reative o acesso antes de reenviar o convite.");
  const user = await getAuthUserById(profileId);
  if (!user?.email || user.app_metadata?.pulsa_core_activated_at || user.app_metadata?.pulsa_surface !== "core") {
    throw new AppError("CONFLICT", "Este usuário não tem um convite pendente.");
  }
  return sendCoreInvitation(user.email);
}

async function changeOrganizationMember(
  profileId: string,
  target: { role?: OrganizationRole; status?: MembershipStatus },
): Promise<OrganizationMember> {
  const { organizationId } = await requirePermission("organization_member:update");
  const { data: current, error: findError } = await findOrganizationMemberById(
    organizationId,
    profileId,
  );
  if (findError) throwAdministrationRepositoryError(findError, "find_membership_for_change");
  if (!current) throw new AppError("NOT_FOUND", "Membership não encontrada.");

  const parsed = parseOrganizationMember(current);
  const { data, error } = await mutateOrganizationMembership(
    organizationId,
    profileId,
    target.role ?? parsed.role,
    target.status ?? parsed.status,
  );
  if (error) throwAdministrationRepositoryError(error, "change_organization_membership");
  return parseOrganizationMember({ ...data, profile: parsed.profile });
}

export function changeOrganizationMemberRole(
  profileId: string,
  role: OrganizationRole,
) {
  return changeOrganizationMember(profileId, { role });
}

export function changeOrganizationMemberStatus(
  profileId: string,
  status: MembershipStatus,
) {
  return changeOrganizationMember(profileId, { status });
}
