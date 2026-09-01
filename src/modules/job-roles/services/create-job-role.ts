import { requirePermission } from "@/modules/authorization";

import { parseJobRole, type JobRole } from "../domain/job-role";
import { insertJobRole } from "../repositories/job-role-repository";
import { jobRoleInputSchema } from "../schemas/job-role-schemas";
import { throwJobRoleRepositoryError } from "./repository-errors";

export async function createJobRole(input: unknown): Promise<JobRole> {
  const { organizationId } = await requirePermission("job_role:create");
  const valid = jobRoleInputSchema.parse(input);
  const { data, error } = await insertJobRole(organizationId, valid);
  if (error) throwJobRoleRepositoryError(error, "create");
  return parseJobRole(data);
}
