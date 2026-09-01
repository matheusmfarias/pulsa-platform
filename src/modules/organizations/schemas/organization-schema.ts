import { z } from "zod";

export const organizationStatusSchema = z.enum(["active", "inactive"]);

export type OrganizationStatus = z.infer<typeof organizationStatusSchema>;
