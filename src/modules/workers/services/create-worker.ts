import { requirePermission } from "@/modules/authorization";

import { parseWorker, type Worker } from "../domain/worker";
import { insertWorker } from "../repositories/worker-repository";
import { workerInputSchema } from "../schemas/worker-schemas";
import { throwWorkerRepositoryError } from "./repository-errors";

export async function createWorker(input: unknown): Promise<Worker> {
  const validInput = workerInputSchema.parse(input);
  const { organizationId } = await requirePermission("worker:create");
  const { data, error } = await insertWorker(organizationId, validInput);
  if (error) throwWorkerRepositoryError(error, "create_worker");
  return parseWorker(data);
}
