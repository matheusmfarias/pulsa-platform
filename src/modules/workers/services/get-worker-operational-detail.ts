import { findActiveAssignment, listAssignments } from "@/modules/assignments";

import { getWorkerById } from "./get-worker-by-id";

export async function getWorkerOperationalDetail(workerId: string) {
  const [worker, assignments] = await Promise.all([
    getWorkerById(workerId),
    listAssignments({ workerId }),
  ]);
  return { worker, assignments, activeAssignment: findActiveAssignment(assignments) };
}
