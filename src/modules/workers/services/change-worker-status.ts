import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import {
  canTransitionWorkerStatus,
  parseWorker,
  type Worker,
  workerStatusSchema,
} from "../domain/worker";
import {
  findWorkerById,
  updateWorkerStatus,
} from "../repositories/worker-repository";
import { workerIdSchema } from "../schemas/worker-schemas";
import { throwWorkerRepositoryError } from "./repository-errors";

export async function changeWorkerStatus(
  workerId: unknown,
  targetStatus: unknown,
): Promise<Worker> {
  const id = workerIdSchema.parse(workerId);
  const target = workerStatusSchema.parse(targetStatus);
  const { organizationId } = await requirePermission("worker:update");
  const currentResult = await findWorkerById(organizationId, id);
  if (currentResult.error) {
    throwWorkerRepositoryError(currentResult.error, "get_worker_for_status");
  }
  if (!currentResult.data) {
    throw new AppError("NOT_FOUND", "Worker não encontrado.");
  }
  const current = parseWorker(currentResult.data);
  if (!canTransitionWorkerStatus(current.status, target)) {
    throw new AppError(
      "CONFLICT",
      "Esta transição de status não é permitida.",
    );
  }
  const { data, error } = await updateWorkerStatus(
    organizationId,
    id,
    current.status,
    target,
  );
  if (error) throwWorkerRepositoryError(error, "change_worker_status");
  if (!data) {
    throw new AppError(
      "CONFLICT",
      "O status mudou durante a operação. Atualize a página.",
    );
  }
  return parseWorker(data);
}
