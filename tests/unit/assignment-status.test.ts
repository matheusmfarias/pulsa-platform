import { describe, expect, it } from "vitest";

import { canTransitionAssignmentStatus } from "@/modules/assignments/domain/assignment";

describe("Assignment status transitions", () => {
  it("allows the simple operational lifecycle", () => {
    expect(canTransitionAssignmentStatus("pending", "active")).toBe(true);
    expect(canTransitionAssignmentStatus("active", "suspended")).toBe(true);
    expect(canTransitionAssignmentStatus("suspended", "finished")).toBe(true);
  });

  it("keeps final states terminal and rejects obvious invalid transitions", () => {
    expect(canTransitionAssignmentStatus("finished", "active")).toBe(false);
    expect(canTransitionAssignmentStatus("cancelled", "pending")).toBe(false);
    expect(canTransitionAssignmentStatus("pending", "finished")).toBe(false);
  });
});
