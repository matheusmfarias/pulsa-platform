import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseWorker, type Worker } from "../domain/worker";
import { findWorkerById } from "../repositories/worker-repository";
import { workerIdSchema } from "../schemas/worker-schemas";
import { throwWorkerRepositoryError } from "./repository-errors";

export async function getWorkerById(workerId: unknown): Promise<Worker> {
  const id = workerIdSchema.parse(workerId);
  const { organizationId } = await requirePermission("worker:read");
  const { data, error } = await findWorkerById(organizationId, id);
  if (error) throwWorkerRepositoryError(error, "get_worker");
  if (!data) throw new AppError("NOT_FOUND", "Worker não encontrado.");
  return parseWorker(data);
}
