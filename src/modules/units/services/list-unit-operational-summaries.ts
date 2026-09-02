import {
  listActivePositionOccupancyItems,
  type ActivePositionOccupancyItem,
} from "@/modules/positions";

import { listUnits } from "./list-units";

export type UnitOperationalSummary = Awaited<ReturnType<typeof listUnits>>[number] & {
  activeAssignments: number;
  activePositions: number;
  baseRequiredHeadcount: number;
};

export async function listUnitOperationalSummaries(): Promise<
  UnitOperationalSummary[]
> {
  const [units, positions] = await Promise.all([
    listUnits(),
    listActivePositionOccupancyItems(),
  ]);
  const positionsByUnit = groupPositionsByUnit(positions);

  return units.map((unit) => {
    const unitPositions = positionsByUnit.get(unit.id) ?? [];
    return {
      ...unit,
      activeAssignments: unitPositions.reduce(
        (total, position) => total + position.assignments.length,
        0,
      ),
      activePositions: unitPositions.length,
      baseRequiredHeadcount: unitPositions.reduce(
        (total, position) => total + position.base_required_headcount,
        0,
      ),
    };
  });
}

function groupPositionsByUnit(
  positions: ActivePositionOccupancyItem[],
): Map<string, ActivePositionOccupancyItem[]> {
  return positions.reduce((grouped, position) => {
    const entries = grouped.get(position.unit_id) ?? [];
    entries.push(position);
    grouped.set(position.unit_id, entries);
    return grouped;
  }, new Map<string, ActivePositionOccupancyItem[]>());
}
