import { z } from "zod";

import type { Tables } from "@/shared/db/database.types";

export const jobRoleStatusSchema = z.enum(["active", "inactive"]);
export type JobRoleStatus = z.infer<typeof jobRoleStatusSchema>;
export type JobRole = Omit<Tables<"job_roles">, "status"> & {
  status: JobRoleStatus;
};

export const JOB_ROLE_STATUS_LABELS: Record<JobRoleStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export function parseJobRole(row: Tables<"job_roles">): JobRole {
  return { ...row, status: jobRoleStatusSchema.parse(row.status) };
}
