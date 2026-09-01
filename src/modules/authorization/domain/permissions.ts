import type { OrganizationRole } from "@/modules/organizations";
import { AppError } from "@/shared/errors";

export const AUTHORIZATION_ENTITIES = [
  "client",
  "contract",
  "operation",
  "unit",
  "job_role",
  "position",
  "worker",
  "assignment",
] as const;

export const AUTHORIZATION_ACTIONS = ["read", "create", "update"] as const;

export type AuthorizationEntity = (typeof AUTHORIZATION_ENTITIES)[number];
export type AuthorizationAction = (typeof AUTHORIZATION_ACTIONS)[number];
export type Permission = `${AuthorizationEntity}:${AuthorizationAction}`;

const ALL_PERMISSIONS = AUTHORIZATION_ENTITIES.flatMap((entity) =>
  AUTHORIZATION_ACTIONS.map((action) => `${entity}:${action}` as Permission),
);

const READ_PERMISSIONS = AUTHORIZATION_ENTITIES.map(
  (entity) => `${entity}:read` as Permission,
);

export const ROLE_PERMISSIONS = {
  DIRECTOR: ALL_PERMISSIONS,
  OPERATIONS_MANAGER: [
    "client:read",
    "client:create",
    "client:update",
    "contract:read",
    "contract:create",
    "contract:update",
    "operation:read",
    "operation:create",
    "operation:update",
    "unit:read",
    "unit:create",
    "unit:update",
    "job_role:read",
    "job_role:create",
    "job_role:update",
    "position:read",
    "position:create",
    "position:update",
    "worker:read",
    "assignment:read",
    "assignment:create",
    "assignment:update",
  ],
  SUPERVISOR: [
    "client:read",
    "contract:read",
    "operation:read",
    "unit:read",
    "unit:update",
    "job_role:read",
    "position:read",
    "position:update",
    "worker:read",
    "assignment:read",
  ],
  HR: [
    ...READ_PERMISSIONS,
    "worker:create",
    "worker:update",
    "assignment:update",
  ],
  RECRUITER: [...READ_PERMISSIONS, "worker:create"],
  ADMINISTRATIVE: READ_PERMISSIONS,
} satisfies Record<OrganizationRole, readonly Permission[]>;

export type AuthorizationContext = { role: OrganizationRole };

export function can(
  context: AuthorizationContext,
  permission: Permission,
): boolean {
  const permissions: readonly Permission[] = ROLE_PERMISSIONS[context.role];
  return permissions.includes(permission);
}

export function authorize<T extends AuthorizationContext>(
  context: T,
  permission: Permission,
): T {
  if (!can(context, permission)) {
    throw new AppError(
      "AUTHORIZATION",
      "Você não possui permissão para realizar esta ação.",
    );
  }
  return context;
}
