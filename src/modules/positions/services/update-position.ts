import { AppError } from "@/shared/errors";
import { requirePermission } from "@/modules/authorization";
import { getJobRoleById } from "@/modules/job-roles";
import { getUnitById } from "@/modules/units";
import { parsePosition } from "../domain/position";
import { updatePositionRecord } from "../repositories/position-repository";
import {
  positionIdSchema,
  positionInputSchema,
} from "../schemas/position-schemas";
import { getPositionById } from "./get-position-by-id";
import { throwPositionRepositoryError } from "./repository-errors";
export async function updatePosition(id: unknown, input: unknown) {
  await requirePermission("position:update");
  const positionId = positionIdSchema.parse(id);
  const valid = positionInputSchema.parse(input);
  const current = await getPositionById(positionId);
  if (valid.unit_id !== current.unit_id) {
    const unit = await getUnitById(valid.unit_id);
    if (unit.status !== "active")
      throw new AppError(
        "VALIDATION",
        "A posição só pode ser movida para uma unidade ativa.",
      );
  }
  if (valid.job_role_id !== current.job_role_id) {
    const jobRole = await getJobRoleById(valid.job_role_id);
    if (jobRole.status !== "active")
      throw new AppError(
        "VALIDATION",
        "A posição só pode ser vinculada a um cargo ativo.",
      );
  }
  const { data, error } = await updatePositionRecord(positionId, valid);
  if (error) throwPositionRepositoryError(error, "update");
  if (!data)
    throw new AppError("CONFLICT", "A posição foi alterada por outra sessão.");
  return parsePosition(data);
}
