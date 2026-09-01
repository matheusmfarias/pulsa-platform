import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUnitById } from "@/modules/units";
import { getJobRoleById } from "@/modules/job-roles";
import { insertPosition } from "@/modules/positions/repositories/position-repository";
import { createPosition } from "@/modules/positions/services/create-position";

vi.mock("@/modules/units", () => ({ getUnitById: vi.fn() }));
vi.mock("@/modules/job-roles", () => ({ getJobRoleById: vi.fn() }));
vi.mock("@/modules/authorization", () => ({
  requirePermission: vi.fn().mockResolvedValue({
    organizationId: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000701",
    role: "DIRECTOR",
  }),
}));
vi.mock("@/modules/positions/repositories/position-repository", () => ({ insertPosition: vi.fn() }));

const input = { unit_id: "00000000-0000-4000-8000-000000000401", job_role_id: "00000000-0000-4000-8000-000000000451", description: null, base_required_headcount: 4 };
const position = { id: "00000000-0000-4000-8000-000000000501", ...input, status: "active", created_at: "2026-09-01T02:00:00Z", updated_at: "2026-09-01T02:00:00Z" };
describe("position services", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects creation in an inactive unit", async () => {
    vi.mocked(getUnitById).mockResolvedValue({ status: "inactive" } as never);
    vi.mocked(getJobRoleById).mockResolvedValue({ status: "active" } as never);
    await expect(createPosition(input)).rejects.toMatchObject({ code: "VALIDATION" });
    expect(insertPosition).not.toHaveBeenCalled();
  });
  it("creates an active position in an active unit", async () => {
    vi.mocked(getUnitById).mockResolvedValue({ status: "active" } as never);
    vi.mocked(getJobRoleById).mockResolvedValue({ status: "active" } as never);
    vi.mocked(insertPosition).mockResolvedValue({ data: position, error: null } as never);
    await expect(createPosition(input)).resolves.toMatchObject({ status: "active", base_required_headcount: 4 });
  });
  it("rejects creation with an inactive job role", async () => {
    vi.mocked(getUnitById).mockResolvedValue({ status: "active" } as never);
    vi.mocked(getJobRoleById).mockResolvedValue({ status: "inactive" } as never);
    await expect(createPosition(input)).rejects.toMatchObject({ code: "VALIDATION" });
    expect(insertPosition).not.toHaveBeenCalled();
  });
});
