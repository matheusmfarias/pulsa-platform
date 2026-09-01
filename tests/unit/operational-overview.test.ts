import { describe, expect, it } from "vitest";

import { buildOperationalOverview } from "@/modules/overview/operational-overview";

const worker = (id: string) => ({ id }) as never;
const position = (id: string, headcount: number, operationId = "operation-1") =>
  ({
    id,
    base_required_headcount: headcount,
    unit: { operation: { id: operationId } },
  }) as never;
const assignment = (workerId: string, positionId: string, operationId = "operation-1") =>
  ({
    worker_id: workerId,
    position_id: positionId,
    position: { unit: { operation: { id: operationId } } },
  }) as never;

describe("operational overview", () => {
  it("identifies active workers without an active assignment and underfilled positions", () => {
    const overview = buildOperationalOverview({
      activeOperations: [{ id: "operation-1", name: "Centro", contract: { client: { trade_name: "Cliente" } } }] as never,
      activeUnits: [{ id: "unit-1", operation: { id: "operation-1" } }] as never,
      activeWorkers: [worker("worker-1"), worker("worker-2")],
      activePositions: [position("position-1", 2)],
      activeAssignments: [assignment("worker-1", "position-1")],
    });

    expect(overview.attention).toEqual({
      activeWorkersWithoutAssignment: 1,
      underfilledPositions: 1,
    });
    expect(overview.kpis).toMatchObject({
      activeAssignments: 1,
      activePositions: 1,
      totalRequiredHeadcount: 2,
    });
  });

  it("does not flag a position at or above its required headcount", () => {
    const overview = buildOperationalOverview({
      activeOperations: [],
      activeUnits: [],
      activeWorkers: [worker("worker-1"), worker("worker-2")],
      activePositions: [position("position-1", 1)],
      activeAssignments: [
        assignment("worker-1", "position-1"),
        assignment("worker-2", "position-1"),
      ],
    });

    expect(overview.attention.underfilledPositions).toBe(0);
  });

  it("returns zero values for an empty organization", () => {
    const overview = buildOperationalOverview({
      activeOperations: [],
      activeUnits: [],
      activeWorkers: [],
      activePositions: [],
      activeAssignments: [],
    });

    expect(overview.kpis).toEqual({
      activeAssignments: 0,
      activeOperations: 0,
      activePositions: 0,
      activeUnits: 0,
      activeWorkers: 0,
      totalRequiredHeadcount: 0,
    });
    expect(overview.attention).toEqual({
      activeWorkersWithoutAssignment: 0,
      underfilledPositions: 0,
    });
  });
});
