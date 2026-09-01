import { AppError } from "@/shared/errors";

import { findAssignmentParents } from "../repositories/assignment-repository";

export async function validateAssignmentParents(
  workerId: string,
  positionId: string,
) {
  const { worker, position } = await findAssignmentParents(workerId, positionId);
  if (worker.error || position.error) {
    throw new AppError("INFRASTRUCTURE", "Falha ao validar Worker e Position.");
  }
  if (!worker.data) throw new AppError("VALIDATION", "Worker não encontrado.");
  if (!position.data) throw new AppError("VALIDATION", "Position não encontrada.");
  const positionOrganizationId =
    position.data.unit.operation.contract.client.organization_id;
  if (worker.data.organization_id !== positionOrganizationId) {
    throw new AppError(
      "VALIDATION",
      "Worker e Position precisam pertencer à mesma organização.",
    );
  }
  return { worker: worker.data, position: position.data };
}
