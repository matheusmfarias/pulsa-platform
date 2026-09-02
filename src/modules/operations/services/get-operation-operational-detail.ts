import {
  buildPositionOccupancy,
  listAssignmentsForOperation,
  sumBaseRequiredHeadcount,
} from "@/modules/assignments";
import { listPositionsForOperation, type PositionWithContext } from "@/modules/positions";
import { listUnits, type UnitWithContext } from "@/modules/units";

import { getOperationById } from "./get-operation-by-id";

export type OperationOperationalDetail = Awaited<ReturnType<typeof getOperationById>> & {
  units: Array<UnitWithContext & { activeAssignments: number; activePositions: number; baseRequiredHeadcount: number }>;
  summary: {
    activeAssignments: number;
    activePositions: number;
    activeUnits: number;
    baseRequiredHeadcount: number;
  };
};

export async function getOperationOperationalDetail(
  operationId: string,
): Promise<OperationOperationalDetail> {
  const [operation, units, positions, assignments] = await Promise.all([
    getOperationById(operationId),
    listUnits({ operationId }),
    listPositionsForOperation(operationId),
    listAssignmentsForOperation(operationId),
  ]);
  const activeAssignments = assignments.filter(
    (assignment) => assignment.status === "active",
  );
  const occupancy = buildPositionOccupancy(positions, activeAssignments);

  return {
    ...operation,
    summary: {
      activeAssignments: activeAssignments.length,
      activePositions: positions.filter((position) => position.status === "active").length,
      activeUnits: units.filter((unit) => unit.status === "active").length,
      baseRequiredHeadcount: sumBaseRequiredHeadcount(
        positions.filter((position) => position.status === "active"),
      ),
    },
    units: units.map((unit) => buildUnitSummary(unit, positions, occupancy)),
  };
}

function buildUnitSummary(
  unit: UnitWithContext,
  positions: PositionWithContext[],
  occupancy: Map<string, { activeAssignments: number }>,
): UnitWithContext & {
  activeAssignments: number;
  activePositions: number;
  baseRequiredHeadcount: number;
} {
  const unitPositions = positions.filter((position) => position.unit.id === unit.id);
  return {
    ...unit,
    activeAssignments: unitPositions.reduce(
      (total, position) => total + (occupancy.get(position.id)?.activeAssignments ?? 0),
      0,
    ),
    activePositions: unitPositions.filter((position) => position.status === "active").length,
    baseRequiredHeadcount: sumBaseRequiredHeadcount(
      unitPositions.filter((position) => position.status === "active"),
    ),
  };
}
