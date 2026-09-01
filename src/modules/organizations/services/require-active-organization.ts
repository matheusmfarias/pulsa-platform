import { getAuthenticatedUser } from "@/modules/auth";
import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { resolveSingleActiveOrganization } from "../domain/resolve-active-organization";
import { findActiveOrganizationMemberships } from "../repositories/organization-membership-repository";
import {
  organizationRoleSchema,
  type OrganizationRole,
} from "../schemas/organization-role-schema";

export type ActiveOrganizationContext = {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
};

export async function requireActiveOrganization(): Promise<ActiveOrganizationContext> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new AppError("AUTHORIZATION", "Faça login para continuar.");
  }

  const { data, error } = await findActiveOrganizationMemberships(user.id);

  if (error) {
    logger.error({
      event: "organization.membership_lookup_failed",
      errorCode: error.code,
      operation: "resolve_active_organization",
    });
    throw new AppError("INFRASTRUCTURE", "Falha ao consultar organização.");
  }

  return {
    organizationId: resolveSingleActiveOrganization(data),
    userId: user.id,
    role: organizationRoleSchema.parse(data[0].role),
  };
}
