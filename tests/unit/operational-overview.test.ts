import { describe, expect, it } from "vitest";

import { operationalOverviewSchema } from "@/modules/overview/operational-overview";

describe("operational overview result", () => {
  it("accepts aggregate metrics and per-operation rows from the database", () => {
    expect(
      operationalOverviewSchema.parse({
        kpis: {
          activeAssignments: 120,
          activeOperations: 2,
          activePositions: 12,
          activeUnits: 4,
          activeWorkers: 150,
          totalRequiredHeadcount: 180,
        },
        attention: {
          activeWorkersWithoutAssignment: 30,
          underfilledPositions: 3,
        },
        operations: [
          {
            id: "00000000-0000-4000-8000-000000000301",
            name: "Apoio de loja",
            clientName: "Vértice Varejo",
            units: 2,
            positions: 7,
            allocatedWorkers: 80,
          },
        ],
      }),
    ).toMatchObject({ kpis: { activeWorkers: 150 }, operations: [{ allocatedWorkers: 80 }] });
  });

  it("rejects invalid counts instead of rendering malformed database results", () => {
    expect(() =>
      operationalOverviewSchema.parse({
        kpis: {
          activeAssignments: -1,
          activeOperations: 0,
          activePositions: 0,
          activeUnits: 0,
          activeWorkers: 0,
          totalRequiredHeadcount: 0,
        },
        attention: { activeWorkersWithoutAssignment: 0, underfilledPositions: 0 },
        operations: [],
      }),
    ).toThrow();
  });
});
