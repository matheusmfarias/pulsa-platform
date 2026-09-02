export type PositionHeadcount = {
  id: string;
  base_required_headcount: number;
};

export type ActiveAssignmentReference = {
  position_id: string;
};

export type AssignmentStatusReference = {
  status: string;
};

export type PositionOccupancy = {
  activeAssignments: number;
  baseRequiredHeadcount: number;
  deficit: number;
};

export function buildPositionOccupancy(
  positions: readonly PositionHeadcount[],
  activeAssignments: readonly ActiveAssignmentReference[],
): Map<string, PositionOccupancy> {
  const activeByPosition = new Map<string, number>();

  for (const assignment of activeAssignments) {
    activeByPosition.set(
      assignment.position_id,
      (activeByPosition.get(assignment.position_id) ?? 0) + 1,
    );
  }

  return new Map(
    positions.map((position) => {
      const activeAssignments = activeByPosition.get(position.id) ?? 0;
      return [
        position.id,
        {
          activeAssignments,
          baseRequiredHeadcount: position.base_required_headcount,
          deficit: Math.max(
            position.base_required_headcount - activeAssignments,
            0,
          ),
        },
      ];
    }),
  );
}

export function sumBaseRequiredHeadcount(
  positions: readonly PositionHeadcount[],
): number {
  return positions.reduce(
    (total, position) => total + position.base_required_headcount,
    0,
  );
}

export function findActiveAssignment<T extends AssignmentStatusReference>(
  assignments: readonly T[],
): T | undefined {
  return assignments.find((assignment) => assignment.status === "active");
}
