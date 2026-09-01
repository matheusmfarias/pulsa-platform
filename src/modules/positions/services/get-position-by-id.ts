import { AppError } from "@/shared/errors";
import { requirePermission } from "@/modules/authorization";
import { parsePositionWithContext } from "../domain/position";
import { findPositionById } from "../repositories/position-repository";
import { positionIdSchema } from "../schemas/position-schemas";
import { throwPositionRepositoryError } from "./repository-errors";
export async function getPositionById(id: unknown) {
  await requirePermission("position:read");
  const valid = positionIdSchema.parse(id);
  const { data, error } = await findPositionById(valid);
  if (error) throwPositionRepositoryError(error, "get");
  if (!data) throw new AppError("NOT_FOUND", "Posição não encontrada.");
  return parsePositionWithContext(data);
}
