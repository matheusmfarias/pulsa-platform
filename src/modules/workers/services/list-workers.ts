import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";

import { parseWorker, type Worker } from "../domain/worker";
import { findWorkers } from "../repositories/worker-repository";
import {
  workerListFiltersSchema,
  type WorkerListFilters,
} from "../schemas/worker-schemas";
import { throwWorkerRepositoryError } from "./repository-errors";

export async function listWorkers(
  filters: WorkerListFilters = { query: "", status: "all" },
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<Worker[]> {
  const validFilters = workerListFiltersSchema.parse(filters);
  const { organizationId } = await requirePermission("worker:read");
  const { data, error } = await findWorkers(
    organizationId,
    validFilters,
    operationalContext,
  );
  if (error) throwWorkerRepositoryError(error, "list_workers");
  return data.map(parseWorker);
}
