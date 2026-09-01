import { AppError } from "@/shared/errors";
import { requirePermission } from "@/modules/authorization";
import { parsePosition, positionStatusSchema } from "../domain/position";
import { updatePositionStatus } from "../repositories/position-repository";
import { positionIdSchema } from "../schemas/position-schemas";
import { getPositionById } from "./get-position-by-id";
import { throwPositionRepositoryError } from "./repository-errors";
export async function changePositionStatus(id: unknown, status: unknown) {
  await requirePermission("position:update");
  const positionId = positionIdSchema.parse(id);
  const target = positionStatusSchema.parse(status);
  const current = await getPositionById(positionId);
  if (current.status === target)
    throw new AppError("CONFLICT", "A posição já está neste status.");
  const { data, error } = await updatePositionStatus(
    positionId,
    current.status,
    target,
  );
  if (error) throwPositionRepositoryError(error, "status");
  if (!data)
    throw new AppError("CONFLICT", "O status foi alterado por outra sessão.");
  return parsePosition(data);
}
