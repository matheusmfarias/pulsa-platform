import { requirePermission } from "@/modules/authorization";

import { parseJobRole, type JobRole } from "../domain/job-role";
import { findJobRoles } from "../repositories/job-role-repository";
import {
  jobRoleListFiltersSchema,
  type JobRoleListFilters,
} from "../schemas/job-role-schemas";
import { throwJobRoleRepositoryError } from "./repository-errors";

export async function listJobRoles(
  filters: Partial<JobRoleListFilters> = {},
): Promise<JobRole[]> {
  const valid = jobRoleListFiltersSchema.parse(filters);
  const { organizationId } = await requirePermission("job_role:read");
  const { data, error } = await findJobRoles(organizationId, valid);
  if (error) throwJobRoleRepositoryError(error, "list");
  return (data ?? []).map(parseJobRole);
}
