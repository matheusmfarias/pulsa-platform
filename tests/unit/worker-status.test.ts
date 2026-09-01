import { describe, expect, it } from "vitest";

import {
  canTransitionWorkerStatus,
  WORKER_STATUS_TRANSITIONS,
} from "@/modules/workers";

describe("worker status transitions", () => {
  it.each([
    ["onboarding", "active"],
    ["onboarding", "inactive"],
    ["active", "inactive"],
    ["active", "terminated"],
    ["inactive", "active"],
    ["inactive", "terminated"],
  ] as const)("allows %s -> %s", (current, target) => {
    expect(canTransitionWorkerStatus(current, target)).toBe(true);
  });

  it("keeps terminated final and rejects ambiguous transitions", () => {
    expect(WORKER_STATUS_TRANSITIONS.terminated).toEqual([]);
    expect(canTransitionWorkerStatus("onboarding", "terminated")).toBe(false);
    expect(canTransitionWorkerStatus("active", "onboarding")).toBe(false);
  });
});
