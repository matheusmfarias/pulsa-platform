import { describe, expect, it } from "vitest";

import {
  organizationRoleSchema,
  organizationStatusSchema,
} from "@/modules/organizations";

describe("organizationStatusSchema", () => {
  it.each(["active", "inactive"])("accepts %s", (status) => {
    expect(organizationStatusSchema.parse(status)).toBe(status);
  });

  it("rejects statuses outside Foundation Core", () => {
    expect(organizationStatusSchema.safeParse("deleted").success).toBe(false);
  });
});

describe("organizationRoleSchema", () => {
  it.each([
    "DIRECTOR",
    "OPERATIONS_MANAGER",
    "SUPERVISOR",
    "HR",
    "RECRUITER",
    "ADMINISTRATIVE",
  ])("accepts %s", (role) => {
    expect(organizationRoleSchema.parse(role)).toBe(role);
  });

  it("rejects roles outside the internal matrix", () => {
    expect(organizationRoleSchema.safeParse("OWNER").success).toBe(false);
  });
});
