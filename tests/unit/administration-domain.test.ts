import { describe, expect, it } from "vitest";

import {
  readAuditMetadata,
} from "@/modules/administration/domain/audit-event";
import { auditListFiltersSchema, inviteOrganizationUserSchema } from "@/modules/administration/schemas/administration-schemas";
import { activationCodeSchema, activationPasswordSchema } from "@/modules/auth/schemas/activation-schema";

describe("administration domain", () => {
  it("normalizes an invitation and rejects an invalid role", () => {
    expect(inviteOrganizationUserSchema.parse({ displayName: "  Ana Lima  ", email: "  ANA@EXAMPLE.COM  ", role: "HR" })).toEqual({
      displayName: "Ana Lima", email: "ana@example.com", role: "HR",
    });
    expect(inviteOrganizationUserSchema.safeParse({ displayName: "Ana Lima", email: "ana@example.com", role: "OWNER" }).success).toBe(false);
  });

  it("requires a valid activation code and matching password confirmation", () => {
    expect(activationCodeSchema.safeParse({ email: "ana@example.com", token: "12345678" }).success).toBe(true);
    expect(activationCodeSchema.safeParse({ email: "ana@example.com", token: "1234" }).success).toBe(false);
    expect(activationPasswordSchema.safeParse({ password: "correct-horse", passwordConfirmation: "different" }).success).toBe(false);
  });
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

  it("accepts Presence audit events", () => {
    expect(
      auditListFiltersSchema.parse({
        entityType: "presence",
        action: "record_arrival",
      }),
    ).toMatchObject({
      entityType: "presence",
      action: "record_arrival",
    });
  });
});
