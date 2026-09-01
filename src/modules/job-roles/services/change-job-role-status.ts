import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import {
  jobRoleStatusSchema,
  parseJobRole,
  type JobRole,
} from "../domain/job-role";
import { updateJobRoleStatus } from "../repositories/job-role-repository";
import { jobRoleIdSchema } from "../schemas/job-role-schemas";
import { getJobRoleById } from "./get-job-role-by-id";
import { throwJobRoleRepositoryError } from "./repository-errors";

export async function changeJobRoleStatus(
  id: unknown,
  status: unknown,
): Promise<JobRole> {
  await requirePermission("job_role:update");
  const jobRoleId = jobRoleIdSchema.parse(id);
  const target = jobRoleStatusSchema.parse(status);
  const current = await getJobRoleById(jobRoleId);
  if (current.status === target) {
    throw new AppError(
      "CONFLICT",
      target === "active" ? "O cargo já está ativo." : "O cargo já está inativo.",
    );
  }
  const { data, error } = await updateJobRoleStatus(jobRoleId, target);
  if (error) throwJobRoleRepositoryError(error, "status");
  return parseJobRole(data);
}
