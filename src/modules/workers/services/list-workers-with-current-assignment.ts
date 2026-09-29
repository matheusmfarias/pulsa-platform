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
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}> {
  const { organizationId } = await requirePermission("worker:read");
  const from = (page - 1) * WORKER_LIST_PAGE_SIZE;
  let result = await findWorkers(
    organizationId,
    filters,
    operationalContext,
    { from, to: from + WORKER_LIST_PAGE_SIZE },
  );
  if (result.error) throwWorkerRepositoryError(result.error, "list_workers_page");

  const total = result.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / WORKER_LIST_PAGE_SIZE));
  const effectivePage = Math.min(page, pageCount);
  if (effectivePage !== page) {
    const effectiveFrom = (effectivePage - 1) * WORKER_LIST_PAGE_SIZE;
    result = await findWorkers(organizationId, filters, operationalContext, {
      from: effectiveFrom,
      to: effectiveFrom + WORKER_LIST_PAGE_SIZE,
    });
    if (result.error) throwWorkerRepositoryError(result.error, "list_workers_page");
  }

  const parsedWorkers = (result.data ?? []).map(parseWorker);
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
    page: effectivePage,
    pageCount,
    pageSize: WORKER_LIST_PAGE_SIZE,
    total,
    workers: workersOnPage.map((worker) => ({
      ...worker,
      currentAssignment: assignmentByWorker.get(worker.id) ?? null,
    })),
  };
}
