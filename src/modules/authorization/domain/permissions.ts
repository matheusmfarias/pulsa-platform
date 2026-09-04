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
  "schedule",
  "organization_member",
  "audit",
] as const;

export const AUTHORIZATION_ACTIONS = ["read", "create", "update"] as const;
export const SCHEDULE_AUTHORIZATION_ACTIONS = [
  "read",
  "create",
  "update",
  "submit",
  "approve",
  "publish",
] as const;

export type AuthorizationEntity = (typeof AUTHORIZATION_ENTITIES)[number];
export type AuthorizationAction = (typeof AUTHORIZATION_ACTIONS)[number];
export type ScheduleAuthorizationAction =
  (typeof SCHEDULE_AUTHORIZATION_ACTIONS)[number];
type StandardAuthorizationEntity = Exclude<AuthorizationEntity, "schedule">;
export type Permission =
  | `${StandardAuthorizationEntity}:${AuthorizationAction}`
  | `schedule:${ScheduleAuthorizationAction}`;

const OPERATIONAL_ENTITIES = AUTHORIZATION_ENTITIES.filter(
  (entity) =>
    entity !== "organization_member" &&
    entity !== "audit" &&
    entity !== "schedule",
);

const ALL_OPERATIONAL_PERMISSIONS = OPERATIONAL_ENTITIES.flatMap((entity) =>
  AUTHORIZATION_ACTIONS.map((action) => `${entity}:${action}` as Permission),
);

const OPERATIONAL_READ_PERMISSIONS = OPERATIONAL_ENTITIES.map(
  (entity) => `${entity}:read` as Permission,
);

const ALL_SCHEDULE_PERMISSIONS = SCHEDULE_AUTHORIZATION_ACTIONS.map(
  (action) => `schedule:${action}` as Permission,
);

export const ROLE_PERMISSIONS = {
  DIRECTOR: [
    ...ALL_OPERATIONAL_PERMISSIONS,
    ...ALL_SCHEDULE_PERMISSIONS,
    "organization_member:read",
    "organization_member:update",
    "audit:read",
  ],
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
    ...ALL_SCHEDULE_PERMISSIONS,
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
    ...ALL_SCHEDULE_PERMISSIONS,
  ],
  HR: [
    ...OPERATIONAL_READ_PERMISSIONS,
    "worker:create",
    "worker:update",
    "assignment:update",
    ...ALL_SCHEDULE_PERMISSIONS,
  ],
  RECRUITER: [
    ...OPERATIONAL_READ_PERMISSIONS,
    "worker:create",
    "schedule:read",
  ],
  ADMINISTRATIVE: [...OPERATIONAL_READ_PERMISSIONS, "schedule:read"],
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
