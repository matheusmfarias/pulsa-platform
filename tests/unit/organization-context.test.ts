import { describe, expect, it } from "vitest";

import { resolveSingleActiveOrganization } from "@/modules/organizations/domain/resolve-active-organization";

describe("resolveSingleActiveOrganization", () => {
  it("returns the only active organization", () => {
    expect(
      resolveSingleActiveOrganization([{ organization_id: "organization-1" }]),
    ).toBe("organization-1");
  });

  it("rejects a user without active membership", () => {
    expect(() => resolveSingleActiveOrganization([])).toThrowError(
      "Seu usuário não possui uma organização ativa.",
    );
  });

  it("rejects ambiguous active memberships", () => {
    expect(() =>
      resolveSingleActiveOrganization([
        { organization_id: "organization-1" },
        { organization_id: "organization-2" },
      ]),
    ).toThrowError("Seu usuário possui mais de uma organização ativa");
  });
});
