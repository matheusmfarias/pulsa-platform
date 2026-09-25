import type { ActiveOrganizationContext } from "@/modules/organizations";

import { authorize, type Permission } from "../domain/permissions";
import { getAuthorizationContext } from "./get-authorization-context";

export async function requirePermission(
  permission: Permission,
): Promise<ActiveOrganizationContext> {
  const context = await getAuthorizationContext();
  return authorize(context, permission);
}
