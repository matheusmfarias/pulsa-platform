import {
  listActiveAssignmentsWithContext,
  type AssignmentWithContext,
} from "@/modules/assignments";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";

import type { WorkerListFilters } from "../schemas/worker-schemas";
import { listWorkers } from "./list-workers";

export type WorkerWithCurrentAssignment = Awaited<ReturnType<typeof listWorkers>>[number] & {
  currentAssignment: AssignmentWithContext | null;
};

export async function listWorkersWithCurrentAssignment(
  filters: WorkerListFilters,
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<WorkerWithCurrentAssignment[]> {
  const [workers, assignments] = await Promise.all([
    listWorkers(filters, operationalContext),
    listActiveAssignmentsWithContext(operationalContext),
  ]);
  const assignmentByWorker = new Map<string, AssignmentWithContext>();
  for (const assignment of assignments) {
    if (!assignmentByWorker.has(assignment.worker_id)) {
      assignmentByWorker.set(assignment.worker_id, assignment);
    }
  }

  return workers.map((worker) => ({
    ...worker,
    currentAssignment: assignmentByWorker.get(worker.id) ?? null,
  }));
}
