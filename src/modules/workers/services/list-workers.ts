import { requirePermission } from "@/modules/authorization";

import { parseWorker, type Worker } from "../domain/worker";
import { findWorkers } from "../repositories/worker-repository";
import {
  workerListFiltersSchema,
  type WorkerListFilters,
} from "../schemas/worker-schemas";
import { throwWorkerRepositoryError } from "./repository-errors";

export async function listWorkers(
  filters: WorkerListFilters = { query: "", status: "all" },
): Promise<Worker[]> {
  const validFilters = workerListFiltersSchema.parse(filters);
  const { organizationId } = await requirePermission("worker:read");
  const { data, error } = await findWorkers(organizationId, validFilters);
  if (error) throwWorkerRepositoryError(error, "list_workers");
  return data.map(parseWorker);
}
