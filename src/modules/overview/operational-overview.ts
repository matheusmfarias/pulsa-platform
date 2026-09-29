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
  const allocatedWorkersByOperation = new Map<string, Set<string>>();
  const positionsByOperation = new Map<string, number>();
  const unitsByOperation = new Map<string, number>();

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

  for (const position of activePositions) {
    const operationId = position.unit.operation.id;
    positionsByOperation.set(
      operationId,
      (positionsByOperation.get(operationId) ?? 0) + 1,
    );
  }

  for (const unit of activeUnits) {
    const operationId = unit.operation.id;
    unitsByOperation.set(operationId, (unitsByOperation.get(operationId) ?? 0) + 1);
  }

  for (const assignment of activeAssignments) {
    const operationId = positionOperationIds.get(assignment.position_id);
    if (!operationId) continue;

    let workers = allocatedWorkersByOperation.get(operationId);
    if (!workers) {
      workers = new Set<string>();
      allocatedWorkersByOperation.set(operationId, workers);
    }
    workers.add(assignment.worker_id);
  }

  let underfilledPositions = 0;
  for (const position of activePositions) {
    if (
      (occupancyByPosition.get(position.id) ?? 0) <
      position.base_required_headcount
    ) {
      underfilledPositions += 1;
    }
  }

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
      underfilledPositions,
    },
    operations: activeOperations.map((operation) => {
      return {
        id: operation.id,
        name: operation.name,
        clientName: operation.contract.client.trade_name,
        units: unitsByOperation.get(operation.id) ?? 0,
        positions: positionsByOperation.get(operation.id) ?? 0,
        allocatedWorkers: allocatedWorkersByOperation.get(operation.id)?.size ?? 0,
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
