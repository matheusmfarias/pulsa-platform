import {
  requireActiveOrganization,
  type ActiveOrganizationContext,
} from "@/modules/organizations";

import { authorize, type Permission } from "../domain/permissions";

export async function requirePermission(
  permission: Permission,
): Promise<ActiveOrganizationContext> {
  const context = await requireActiveOrganization();
  return authorize(context, permission);
}
