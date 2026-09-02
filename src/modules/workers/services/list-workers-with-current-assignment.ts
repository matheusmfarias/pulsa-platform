import {
  listActiveAssignmentsWithContext,
  type AssignmentWithContext,
} from "@/modules/assignments";

import type { WorkerListFilters } from "../schemas/worker-schemas";
import { listWorkers } from "./list-workers";

export type WorkerWithCurrentAssignment = Awaited<ReturnType<typeof listWorkers>>[number] & {
  currentAssignment: AssignmentWithContext | null;
};

export async function listWorkersWithCurrentAssignment(
  filters: WorkerListFilters,
): Promise<WorkerWithCurrentAssignment[]> {
  const [workers, assignments] = await Promise.all([
    listWorkers(filters),
    listActiveAssignmentsWithContext(),
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
