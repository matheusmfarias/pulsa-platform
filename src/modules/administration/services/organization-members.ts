import { requirePermission } from "@/modules/authorization";
import type { OrganizationRole } from "@/modules/organizations";
import { AppError } from "@/shared/errors";

import {
  parseOrganizationMember,
  type MembershipStatus,
  type OrganizationMember,
} from "../domain/organization-member";
import {
  findOrganizationMemberById,
  findOrganizationMembers,
  mutateOrganizationMembership,
} from "../repositories/administration-repository";
import { throwAdministrationRepositoryError } from "./repository-errors";

export async function listOrganizationMembers(): Promise<OrganizationMember[]> {
  const { organizationId } = await requirePermission("organization_member:read");
  const { data, error } = await findOrganizationMembers(organizationId);
  if (error) throwAdministrationRepositoryError(error, "list_organization_members");
  return data.map(parseOrganizationMember);
}

export async function getOrganizationMemberById(
  profileId: string,
): Promise<OrganizationMember> {
  const { organizationId } = await requirePermission("organization_member:read");
  const { data, error } = await findOrganizationMemberById(organizationId, profileId);
  if (error) throwAdministrationRepositoryError(error, "get_organization_member");
  if (!data) throw new AppError("NOT_FOUND", "Membership não encontrada.");
  return parseOrganizationMember(data);
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
