import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";
import { listOperations, type OperationWithContext } from "@/modules/operations";
import { listUnits, type UnitWithContext } from "@/modules/units";
import { listWorkers, type Worker } from "@/modules/workers";

import {
  findActiveAssignmentOverviewItems,
  findActivePositionOverviewItems,
  type ActiveAssignmentOverviewItem,
  type ActivePositionOverviewItem,
} from "./overview-repository";

type OverviewSource = {
  activeAssignments: ActiveAssignmentOverviewItem[];
  activeOperations: OperationWithContext[];
  activePositions: ActivePositionOverviewItem[];
  activeUnits: UnitWithContext[];
  activeWorkers: Worker[];
};

export type OperationalOverview = {
  kpis: {
    activeAssignments: number;
    activeOperations: number;
    activePositions: number;
    activeUnits: number;
    activeWorkers: number;
    totalRequiredHeadcount: number;
  };
  attention: {
    activeWorkersWithoutAssignment: number;
    underfilledPositions: number;
  };
  operations: Array<{
    allocatedWorkers: number;
    clientName: string;
    id: string;
    name: string;
    positions: number;
    units: number;
  }>;
};

export function buildOperationalOverview({
  activeAssignments,
  activeOperations,
  activePositions,
  activeUnits,
  activeWorkers,
}: OverviewSource): OperationalOverview {
  const occupancyByPosition = new Map<string, number>();
  const assignedWorkerIds = new Set<string>();

  for (const assignment of activeAssignments) {
    assignedWorkerIds.add(assignment.worker_id);
    occupancyByPosition.set(
      assignment.position_id,
      (occupancyByPosition.get(assignment.position_id) ?? 0) + 1,
    );
  }

  const positionOperationIds = new Map(
    activePositions.map((position) => [position.id, position.unit.operation.id]),
  );

  return {
    kpis: {
      activeOperations: activeOperations.length,
      activeUnits: activeUnits.length,
      activeWorkers: activeWorkers.length,
      activeAssignments: activeAssignments.length,
      activePositions: activePositions.length,
      totalRequiredHeadcount: activePositions.reduce(
        (total, position) => total + position.base_required_headcount,
        0,
      ),
    },
    attention: {
      activeWorkersWithoutAssignment: activeWorkers.filter(
        (worker) => !assignedWorkerIds.has(worker.id),
      ).length,
      underfilledPositions: activePositions.filter(
        (position) =>
          (occupancyByPosition.get(position.id) ?? 0) <
          position.base_required_headcount,
      ).length,
    },
    operations: activeOperations.map((operation) => {
      const operationAssignments = activeAssignments.filter(
        (assignment) => positionOperationIds.get(assignment.position_id) === operation.id,
      );
      return {
        id: operation.id,
        name: operation.name,
        clientName: operation.contract.client.trade_name,
        units: activeUnits.filter((unit) => unit.operation.id === operation.id)
          .length,
        positions: activePositions.filter(
          (position) => position.unit.operation.id === operation.id,
        ).length,
        allocatedWorkers: new Set(
          operationAssignments.map((assignment) => assignment.worker_id),
        ).size,
      };
    }),
  };
}

export async function getOperationalOverview(
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<OperationalOverview> {
  const [activeOperations, activeUnits, activeWorkers, assignmentResult, positionResult] =
    await Promise.all([
      listOperations({ status: "active" }, operationalContext),
      listUnits({ status: "active" }, operationalContext),
      listWorkers({ query: "", status: "active" }, operationalContext),
      requirePermission("assignment:read").then(() =>
        findActiveAssignmentOverviewItems(operationalContext),
      ),
      requirePermission("position:read").then(() =>
        findActivePositionOverviewItems(operationalContext),
      ),
    ]);

  if (positionResult.error || assignmentResult.error) {
    throw positionResult.error ?? assignmentResult.error;
  }

  return buildOperationalOverview({
    activeOperations,
    activeUnits,
    activeWorkers,
    activeAssignments: (assignmentResult.data ?? []) as ActiveAssignmentOverviewItem[],
    activePositions: (positionResult.data ?? []) as ActivePositionOverviewItem[],
  });
}
