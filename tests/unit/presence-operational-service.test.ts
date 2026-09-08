import { beforeEach, describe, expect, it, vi } from "vitest";

import { requirePermission } from "@/modules/authorization";
import { listPresenceOperationalDay } from "@/modules/presences";
import { findPresenceOperationalDay } from "@/modules/presences/repositories/presence-repository";

vi.mock("@/modules/authorization", () => ({ requirePermission: vi.fn() }));
vi.mock("@/modules/presences/repositories/presence-repository", () => ({
  findPresenceOperationalDay: vi.fn(),
}));

const organizationId = "00000000-0000-4000-8000-000000000001";
const clientId = "00000000-0000-4000-8000-000000000002";
const contractId = "00000000-0000-4000-8000-000000000003";

describe("Presence operational service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue({
      organizationId,
      userId: "00000000-0000-4000-8000-000000000004",
      role: "SUPERVISOR",
    });
    vi.mocked(findPresenceOperationalDay).mockResolvedValue({ data: [], error: null } as never);
  });

  it("requires presence:read and sends the requested date", async () => {
    await expect(listPresenceOperationalDay("2026-09-08", { type: "all" })).resolves.toEqual([]);
    expect(requirePermission).toHaveBeenCalledWith("presence:read");
    expect(findPresenceOperationalDay).toHaveBeenCalledWith(
      organizationId,
      "2026-09-08",
      { type: "all" },
    );
  });

  it("preserves client and contract OperationalContext for database filtering", async () => {
    await listPresenceOperationalDay("2026-09-08", { type: "client", clientId });
    await listPresenceOperationalDay("2026-09-08", {
      type: "contract",
      clientId,
      contractId,
    });
    expect(findPresenceOperationalDay).toHaveBeenNthCalledWith(
      1,
      organizationId,
      "2026-09-08",
      { type: "client", clientId },
    );
    expect(findPresenceOperationalDay).toHaveBeenNthCalledWith(
      2,
      organizationId,
      "2026-09-08",
      { type: "contract", clientId, contractId },
    );
  });

  it("rejects invalid calendar dates before querying", async () => {
    await expect(
      listPresenceOperationalDay("2026-02-31", { type: "all" }),
    ).rejects.toThrow("Informe uma data válida");
    expect(findPresenceOperationalDay).not.toHaveBeenCalled();
  });
});
