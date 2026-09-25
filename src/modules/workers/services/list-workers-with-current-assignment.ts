import {
  listActiveAssignmentsWithContext,
  type AssignmentWithContext,
} from "@/modules/assignments";
import type { OperationalContext } from "@/modules/operational-context";

import type { WorkerListFilters } from "../schemas/worker-schemas";
import type { Worker } from "../domain/worker";
import { requirePermission } from "@/modules/authorization";
import { parseWorker } from "../domain/worker";
import { findWorkers } from "../repositories/worker-repository";
import { throwWorkerRepositoryError } from "./repository-errors";

export type WorkerWithCurrentAssignment = Worker & {
  currentAssignment: AssignmentWithContext | null;
};

export const WORKER_LIST_PAGE_SIZE = 50;

export async function listWorkersPageWithCurrentAssignment(
  filters: WorkerListFilters,
  operationalContext: OperationalContext,
  page: number,
): Promise<{
  workers: WorkerWithCurrentAssignment[];
  hasNextPage: boolean;
}> {
  const { organizationId } = await requirePermission("worker:read");
  const from = (page - 1) * WORKER_LIST_PAGE_SIZE;
  const { data, error } = await findWorkers(
    organizationId,
    filters,
    operationalContext,
    { from, to: from + WORKER_LIST_PAGE_SIZE },
  );
  if (error) throwWorkerRepositoryError(error, "list_workers_page");

  const parsedWorkers = data.map(parseWorker);
  const hasNextPage = parsedWorkers.length > WORKER_LIST_PAGE_SIZE;
  const workersOnPage = parsedWorkers.slice(0, WORKER_LIST_PAGE_SIZE);
  const assignments = await listActiveAssignmentsWithContext(
    operationalContext,
    workersOnPage.map((worker) => worker.id),
  );
  const assignmentByWorker = new Map<string, AssignmentWithContext>();
  for (const assignment of assignments) {
    if (!assignmentByWorker.has(assignment.worker_id)) {
      assignmentByWorker.set(assignment.worker_id, assignment);
    }
  }

  return {
    hasNextPage,
    workers: workersOnPage.map((worker) => ({
      ...worker,
      currentAssignment: assignmentByWorker.get(worker.id) ?? null,
    })),
  };
}
