import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseWorker, type Worker } from "../domain/worker";
import { updateWorkerRecord } from "../repositories/worker-repository";
import { workerIdSchema, workerInputSchema } from "../schemas/worker-schemas";
import { throwWorkerRepositoryError } from "./repository-errors";

export async function updateWorker(
  workerId: unknown,
  input: unknown,
): Promise<Worker> {
  const id = workerIdSchema.parse(workerId);
  const validInput = workerInputSchema.parse(input);
  const { organizationId } = await requirePermission("worker:update");
  const { data, error } = await updateWorkerRecord(
    organizationId,
    id,
    validInput,
  );
  if (error) throwWorkerRepositoryError(error, "update_worker");
  if (!data) throw new AppError("NOT_FOUND", "Worker não encontrado.");
  return parseWorker(data);
}
