import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorize,
  can,
  ROLE_PERMISSIONS,
} from "@/modules/authorization/domain/permissions";
import { requirePermission } from "@/modules/authorization/services/require-permission";
import { requireActiveOrganization } from "@/modules/organizations";
import { AppError } from "@/shared/errors";

vi.mock("@/modules/organizations", () => ({
  requireActiveOrganization: vi.fn(),
}));

const context = {
  organizationId: "00000000-0000-4000-8000-000000000001",
  userId: "00000000-0000-4000-8000-000000000701",
  role: "HR" as const,
};

describe("authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("implements representative entries from the role matrix", () => {
    expect(ROLE_PERMISSIONS.DIRECTOR).toHaveLength(27);
    expect(can({ role: "DIRECTOR" }, "organization_member:read")).toBe(true);
    expect(can({ role: "DIRECTOR" }, "organization_member:update")).toBe(true);
    expect(can({ role: "DIRECTOR" }, "audit:read")).toBe(true);
    expect(can({ role: "OPERATIONS_MANAGER" }, "organization_member:read")).toBe(false);
    expect(can({ role: "ADMINISTRATIVE" }, "audit:read")).toBe(false);
    expect(can({ role: "OPERATIONS_MANAGER" }, "operation:update")).toBe(
      true,
    );
    expect(can({ role: "OPERATIONS_MANAGER" }, "worker:create")).toBe(false);
    expect(can({ role: "SUPERVISOR" }, "position:update")).toBe(true);
    expect(can({ role: "SUPERVISOR" }, "position:create")).toBe(false);
    expect(can({ role: "OPERATIONS_MANAGER" }, "job_role:update")).toBe(true);
    expect(can({ role: "SUPERVISOR" }, "job_role:update")).toBe(false);
    expect(can({ role: "RECRUITER" }, "worker:create")).toBe(true);
    expect(can({ role: "ADMINISTRATIVE" }, "client:update")).toBe(false);
    expect(can({ role: "OPERATIONS_MANAGER" }, "assignment:update")).toBe(true);
    expect(can({ role: "SUPERVISOR" }, "assignment:read")).toBe(true);
    expect(can({ role: "SUPERVISOR" }, "assignment:update")).toBe(false);
    expect(can({ role: "HR" }, "assignment:update")).toBe(true);
    expect(can({ role: "RECRUITER" }, "assignment:create")).toBe(false);
  });

  it("authorize returns an allowed context", () => {
    expect(authorize(context, "worker:update")).toBe(context);
  });

  it("authorize denies a role without permission using a safe error", () => {
    expect(() => authorize(context, "client:update")).toThrowError(
      "Você não possui permissão para realizar esta ação.",
    );
  });

  it("requirePermission allows a permitted active membership", async () => {
    vi.mocked(requireActiveOrganization).mockResolvedValue(context);
    await expect(requirePermission("worker:update")).resolves.toBe(context);
  });

  it("keeps an inactive membership denied before checking its role", async () => {
    vi.mocked(requireActiveOrganization).mockRejectedValue(
      new AppError(
        "AUTHORIZATION",
        "Seu usuário não possui uma organização ativa.",
      ),
    );
    await expect(requirePermission("worker:read")).rejects.toMatchObject({
      code: "AUTHORIZATION",
    });
  });
});
