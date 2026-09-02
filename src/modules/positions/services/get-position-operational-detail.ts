import { buildPositionOccupancy, listAssignments } from "@/modules/assignments";

import { getPositionById } from "./get-position-by-id";

export async function getPositionOperationalDetail(positionId: string) {
  const [position, assignments] = await Promise.all([
    getPositionById(positionId),
    listAssignments({ positionId }),
  ]);
  const activeAssignments = assignments.filter(
    (assignment) => assignment.status === "active",
  );
  const occupancy = buildPositionOccupancy([position], activeAssignments).get(position.id)!;
  return { position, assignments, activeAssignments, occupancy };
}
