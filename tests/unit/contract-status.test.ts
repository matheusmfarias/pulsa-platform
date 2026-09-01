import { describe, expect, it } from "vitest";

import {
  canTransitionContractStatus,
  contractStatusSchema,
} from "@/modules/contracts";

describe("contract status", () => {
  it("accepts only the supported statuses", () => {
    expect(contractStatusSchema.safeParse("suspended").success).toBe(true);
    expect(contractStatusSchema.safeParse("inactive").success).toBe(false);
  });

  it("allows explicit lifecycle transitions", () => {
    expect(canTransitionContractStatus("draft", "active")).toBe(true);
    expect(canTransitionContractStatus("active", "suspended")).toBe(true);
    expect(canTransitionContractStatus("suspended", "active")).toBe(true);
  });

  it("keeps ended and cancelled as terminal statuses", () => {
    expect(canTransitionContractStatus("ended", "active")).toBe(false);
    expect(canTransitionContractStatus("cancelled", "draft")).toBe(false);
    expect(canTransitionContractStatus("active", "draft")).toBe(false);
  });
});
