import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOperationById } from "@/modules/operations";
import { insertUnit } from "@/modules/units/repositories/unit-repository";
import { createUnit } from "@/modules/units/services/create-unit";

vi.mock("@/modules/operations", () => ({ getOperationById: vi.fn() }));
vi.mock("@/modules/authorization", () => ({
  requirePermission: vi.fn().mockResolvedValue({
    organizationId: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000701",
    role: "DIRECTOR",
  }),
}));
vi.mock("@/modules/units/repositories/unit-repository", () => ({ insertUnit: vi.fn() }));

const input = { operation_id: "00000000-0000-4000-8000-000000000301", name: "Unidade Centro", code: "CENTRO", address: null, city: null, state: null, timezone: "America/Sao_Paulo" };
const unit = { id: "00000000-0000-4000-8000-000000000401", ...input, status: "active", created_at: "2026-09-01T01:00:00Z", updated_at: "2026-09-01T01:00:00Z" };

describe("unit services", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects creation in a closed operation", async () => {
    vi.mocked(getOperationById).mockResolvedValue({ status: "closed" } as never);
    await expect(createUnit(input)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(insertUnit).not.toHaveBeenCalled();
  });
  it("maps a duplicate code in the same operation to a safe conflict", async () => {
    vi.mocked(getOperationById).mockResolvedValue({ status: "active" } as never);
    vi.mocked(insertUnit).mockResolvedValue({ data: null, error: { code: "23505" } } as never);
    await expect(createUnit(input)).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("creates an active unit for a non-closed operation", async () => {
    vi.mocked(getOperationById).mockResolvedValue({ status: "planning" } as never);
    vi.mocked(insertUnit).mockResolvedValue({ data: unit, error: null } as never);
    await expect(createUnit(input)).resolves.toMatchObject({ status: "active" });
  });
});
