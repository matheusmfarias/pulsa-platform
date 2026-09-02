import { beforeEach, describe, expect, it, vi } from "vitest";

import { cookies } from "next/headers";

import { setOperationalContextAction } from "@/modules/operational-context/actions";
import { listOperationalContextOptions } from "@/modules/operational-context/services/resolve-operational-context";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/modules/operational-context/services/resolve-operational-context", () => ({
  listOperationalContextOptions: vi.fn(),
  OPERATIONAL_CONTEXT_COOKIE: "pulsa-operational-context",
}));

const clientId = "00000000-0000-4000-8000-000000000101";
const contractId = "00000000-0000-4000-8000-000000000201";

describe("setOperationalContextAction", () => {
  const set = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({ set } as never);
    vi.mocked(listOperationalContextOptions).mockResolvedValue([
      {
        id: clientId,
        name: "Vértice Varejo",
        status: "active",
        contracts: [
          { id: contractId, name: "Contrato Nacional", status: "active" },
        ],
      },
    ]);
  });

  it("persists a validated context in a server-readable cookie", async () => {
    await expect(
      setOperationalContextAction({ type: "contract", clientId, contractId }),
    ).resolves.toEqual({ ok: true });
    expect(set).toHaveBeenCalledWith(
      "pulsa-operational-context",
      `contract:${clientId}:${contractId}`,
      expect.objectContaining({ httpOnly: true, path: "/app", sameSite: "lax" }),
    );
  });

  it("does not persist a well-formed but inaccessible context", async () => {
    await expect(
      setOperationalContextAction({
        type: "client",
        clientId: "00000000-0000-4000-8000-000000000999",
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Esse contexto não está mais disponível.",
    });
    expect(set).not.toHaveBeenCalled();
  });
});
