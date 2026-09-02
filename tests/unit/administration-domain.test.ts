import { describe, expect, it } from "vitest";

import {
  auditListFiltersSchema,
  readAuditMetadata,
} from "@/modules/administration";

describe("administration domain", () => {
  it("normalizes audit pagination and supported filters", () => {
    expect(
      auditListFiltersSchema.parse({
        page: "2",
        entityType: "organization_member",
        action: "membership_change",
        actorId: "00000000-0000-4000-8000-000000000001",
      }),
    ).toMatchObject({
      page: 2,
      entityType: "organization_member",
      action: "membership_change",
    });
  });

  it("rejects an inverted audit period", () => {
    expect(() =>
      auditListFiltersSchema.parse({ from: "2026-09-10", to: "2026-09-01" }),
    ).toThrowError("O período inicial deve ser anterior ao período final.");
  });

  it("builds a readable summary from audit metadata", () => {
    expect(
      readAuditMetadata({
        previous_state: { role: "HR" },
        new_state: { role: "DIRECTOR" },
        changes: ["role"],
      }),
    ).toEqual({
      previousState: { role: "HR" },
      newState: { role: "DIRECTOR" },
      changes: ["role"],
    });
  });
});
