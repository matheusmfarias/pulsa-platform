import { cache } from "react";

import {
  requireActiveOrganization,
  type ActiveOrganizationContext,
} from "@/modules/organizations";

export const getAuthorizationContext = cache(
  async (): Promise<ActiveOrganizationContext> => requireActiveOrganization(),
);
