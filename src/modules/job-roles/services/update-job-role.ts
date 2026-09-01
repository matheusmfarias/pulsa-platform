import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseJobRole, type JobRole } from "../domain/job-role";
import { updateJobRoleRecord } from "../repositories/job-role-repository";
import {
  jobRoleIdSchema,
  jobRoleInputSchema,
} from "../schemas/job-role-schemas";
import { throwJobRoleRepositoryError } from "./repository-errors";

export async function updateJobRole(id: unknown, input: unknown): Promise<JobRole> {
  await requirePermission("job_role:update");
  const jobRoleId = jobRoleIdSchema.parse(id);
  const valid = jobRoleInputSchema.parse(input);
  const { data, error } = await updateJobRoleRecord(jobRoleId, valid);
  if (error) throwJobRoleRepositoryError(error, "update");
  if (!data) throw new AppError("NOT_FOUND", "Cargo não encontrado.");
  return parseJobRole(data);
}
