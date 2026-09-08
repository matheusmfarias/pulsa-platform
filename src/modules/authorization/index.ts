export {
  AUTHORIZATION_ACTIONS,
  AUTHORIZATION_ENTITIES,
  ABSENCE_AUTHORIZATION_ACTIONS,
  REPLACEMENT_AUTHORIZATION_ACTIONS,
  ROLE_PERMISSIONS,
  SCHEDULE_AUTHORIZATION_ACTIONS,
  authorize,
  can,
  type AuthorizationAction,
  type AuthorizationContext,
  type AuthorizationEntity,
  type AbsenceAuthorizationAction,
  type ReplacementAuthorizationAction,
  type Permission,
  type ScheduleAuthorizationAction,
} from "./domain/permissions";
export { getAuthorizationContext } from "./services/get-authorization-context";
export { requirePermission } from "./services/require-permission";
export { PermissionGate } from "./components/permission-gate";
