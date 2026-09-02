import { describe, expect, it } from "vitest";

import {
  buildPositionOccupancy,
  findActiveAssignment,
  sumBaseRequiredHeadcount,
} from "@/modules/assignments";

describe("operational assignment metrics", () => {
  it("counts only active assignments supplied to the occupancy calculation", () => {
    const occupancy = buildPositionOccupancy(
      [{ id: "position-1", base_required_headcount: 3 }],
      [{ position_id: "position-1" }, { position_id: "position-1" }],
    );

    expect(occupancy.get("position-1")).toMatchObject({
      activeAssignments: 2,
      deficit: 1,
    });
  });

  it("never returns a negative deficit and aggregates structural headcount", () => {
    const positions = [
      { id: "position-1", base_required_headcount: 2 },
      { id: "position-2", base_required_headcount: 4 },
    ];
    const occupancy = buildPositionOccupancy(positions, [
      { position_id: "position-1" },
      { position_id: "position-1" },
      { position_id: "position-1" },
    ]);

    expect(occupancy.get("position-1")?.deficit).toBe(0);
    expect(sumBaseRequiredHeadcount(positions)).toBe(6);
  });

  it("keeps non-active statuses in history and identifies no current assignment", () => {
    const history = [
      { status: "finished" },
      { status: "suspended" },
      { status: "cancelled" },
    ];

    expect(findActiveAssignment(history)).toBeUndefined();
    expect(history).toHaveLength(3);
  });
});
