import { z } from "zod";

export const organizationRoleSchema = z.enum([
  "DIRECTOR",
  "OPERATIONS_MANAGER",
  "SUPERVISOR",
  "HR",
  "RECRUITER",
  "ADMINISTRATIVE",
]);

export type OrganizationRole = z.infer<typeof organizationRoleSchema>;
