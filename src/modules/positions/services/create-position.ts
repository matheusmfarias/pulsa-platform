import { AppError } from "@/shared/errors";
import { requirePermission } from "@/modules/authorization";
import { getJobRoleById } from "@/modules/job-roles";
import { getUnitById } from "@/modules/units";
import { parsePosition } from "../domain/position";
import { insertPosition } from "../repositories/position-repository";
import { positionInputSchema } from "../schemas/position-schemas";
import { throwPositionRepositoryError } from "./repository-errors";
export async function createPosition(input: unknown) {
  await requirePermission("position:create");
  const valid = positionInputSchema.parse(input);
  const [unit, jobRole] = await Promise.all([
    getUnitById(valid.unit_id),
    getJobRoleById(valid.job_role_id),
  ]);
  if (unit.status !== "active")
    throw new AppError(
      "VALIDATION",
      "Uma nova posição exige uma unidade ativa.",
    );
  if (jobRole.status !== "active")
    throw new AppError("VALIDATION", "Uma nova posição exige um cargo ativo.");
  const { data, error } = await insertPosition(valid);
  if (error) throwPositionRepositoryError(error, "create");
  return parsePosition(data);
}
