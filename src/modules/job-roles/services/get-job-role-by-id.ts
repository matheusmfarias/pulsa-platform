import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseJobRole, type JobRole } from "../domain/job-role";
import { findJobRoleById } from "../repositories/job-role-repository";
import { jobRoleIdSchema } from "../schemas/job-role-schemas";
import { throwJobRoleRepositoryError } from "./repository-errors";

export async function getJobRoleById(id: unknown): Promise<JobRole> {
  const jobRoleId = jobRoleIdSchema.parse(id);
  const { organizationId } = await requirePermission("job_role:read");
  const { data, error } = await findJobRoleById(organizationId, jobRoleId);
  if (error) throwJobRoleRepositoryError(error, "get");
  if (!data) throw new AppError("NOT_FOUND", "Cargo não encontrado.");
  return parseJobRole(data);
}
