import {
  buildPositionOccupancy,
  listAssignmentsForUnit,
  sumBaseRequiredHeadcount,
} from "@/modules/assignments";
import { listPositions, type PositionWithContext } from "@/modules/positions";

import { getUnitById } from "./get-unit-by-id";

export type UnitOperationalDetail = Awaited<ReturnType<typeof getUnitById>> & {
  allocatedWorkers: Awaited<ReturnType<typeof listAssignmentsForUnit>>;
  positions: Array<PositionWithContext & { activeAssignments: number; deficit: number }>;
  summary: {
    activeAssignments: number;
    activePositions: number;
    baseRequiredHeadcount: number;
    deficit: number;
    usedJobRoles: number;
  };
};

export async function getUnitOperationalDetail(unitId: string): Promise<UnitOperationalDetail> {
  const [unit, positions, assignments] = await Promise.all([
    getUnitById(unitId),
    listPositions({ unitId }),
    listAssignmentsForUnit(unitId),
  ]);
  const activeAssignments = assignments.filter(
    (assignment) => assignment.status === "active",
  );
  const occupancy = buildPositionOccupancy(positions, activeAssignments);
  const positionSummaries = positions.map((position) => ({
    ...position,
    activeAssignments: occupancy.get(position.id)?.activeAssignments ?? 0,
    deficit: occupancy.get(position.id)?.deficit ?? position.base_required_headcount,
  }));

  return {
    ...unit,
    allocatedWorkers: activeAssignments,
    positions: positionSummaries,
    summary: {
      activeAssignments: activeAssignments.length,
      activePositions: positions.filter((position) => position.status === "active").length,
      baseRequiredHeadcount: sumBaseRequiredHeadcount(
        positions.filter((position) => position.status === "active"),
      ),
      deficit: positionSummaries
        .filter((position) => position.status === "active")
        .reduce((total, position) => total + position.deficit, 0),
      usedJobRoles: new Set(positions.map((position) => position.job_role.id)).size,
    },
  };
}
