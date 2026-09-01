import { describe, expect, it } from "vitest";

import {
  jobRoleIdSchema,
  jobRoleInputSchema,
  jobRoleStatusSchema,
} from "@/modules/job-roles";

describe("job role schemas", () => {
  it("normalizes the catalog name and optional description", () => {
    expect(jobRoleInputSchema.parse({ name: " Promotor ", description: " Campo " }))
      .toEqual({ name: "Promotor", description: "Campo" });
  });

  it("rejects blank names, invalid ids and unsupported statuses", () => {
    expect(jobRoleInputSchema.safeParse({ name: " ", description: null }).success).toBe(false);
    expect(jobRoleIdSchema.safeParse("invalid").success).toBe(false);
    expect(jobRoleStatusSchema.safeParse("archived").success).toBe(false);
  });
});
