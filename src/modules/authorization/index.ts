export {
  AUTHORIZATION_ACTIONS,
  AUTHORIZATION_ENTITIES,
  ROLE_PERMISSIONS,
  authorize,
  can,
  type AuthorizationAction,
  type AuthorizationContext,
  type AuthorizationEntity,
  type Permission,
} from "./domain/permissions";
export { getAuthorizationContext } from "./services/get-authorization-context";
export { requirePermission } from "./services/require-permission";
export { PermissionGate } from "./components/permission-gate";
