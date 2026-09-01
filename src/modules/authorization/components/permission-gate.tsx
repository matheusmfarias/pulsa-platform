import type { ReactNode } from "react";

import { can, type Permission } from "../domain/permissions";
import { getAuthorizationContext } from "../services/get-authorization-context";

export async function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const context = await getAuthorizationContext();
  return can(context, permission) ? children : fallback;
}
