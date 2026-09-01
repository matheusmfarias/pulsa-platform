import { describe, expect, it } from "vitest";

import {
  canTransitionOperationStatus,
  operationStatusSchema,
} from "@/modules/operations";

describe("operation status", () => {
  it("accepts only the supported statuses", () => {
    expect(operationStatusSchema.safeParse("implementation").success).toBe(true);
    expect(operationStatusSchema.safeParse("cancelled").success).toBe(false);
  });

  it("allows the explicit lifecycle progression", () => {
    expect(canTransitionOperationStatus("planning", "implementation")).toBe(true);
    expect(canTransitionOperationStatus("implementation", "active")).toBe(true);
    expect(canTransitionOperationStatus("active", "closing")).toBe(true);
    expect(canTransitionOperationStatus("closing", "closed")).toBe(true);
  });

  it("supports suspension without reopening a closed operation", () => {
    expect(canTransitionOperationStatus("active", "suspended")).toBe(true);
    expect(canTransitionOperationStatus("suspended", "active")).toBe(true);
    expect(canTransitionOperationStatus("closed", "active")).toBe(false);
    expect(canTransitionOperationStatus("active", "planning")).toBe(false);
  });
});
