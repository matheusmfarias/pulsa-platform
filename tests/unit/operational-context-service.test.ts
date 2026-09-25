import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";

import { authorize, getAuthorizationContext } from "@/modules/authorization";
import { findOperationalContextOptions } from "@/modules/operational-context/repositories/operational-context-repository";
import {
  getOperationalContextSelection,
  listOperationalContextOptions,
} from "@/modules/operational-context/services/resolve-operational-context";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/modules/authorization", () => ({
  authorize: vi.fn((context) => context),
  getAuthorizationContext: vi.fn(),
}));
vi.mock("@/modules/operational-context/repositories/operational-context-repository", () => ({
  findOperationalContextOptions: vi.fn(),
}));

describe("OperationalContext organization protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthorizationContext).mockResolvedValue({
      organizationId: "00000000-0000-4000-8000-000000000001",
      userId: "00000000-0000-4000-8000-000000000701",
      role: "DIRECTOR",
    });
    vi.mocked(findOperationalContextOptions).mockResolvedValue({
      data: [],
      error: null,
    } as never);
  });

  it("uses the active Organization and preserves permission checks", async () => {
    await expect(listOperationalContextOptions()).resolves.toEqual([]);
    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "00000000-0000-4000-8000-000000000001" }),
      "client:read",
    );
    expect(authorize).toHaveBeenCalledWith(expect.anything(), "contract:read");
    expect(findOperationalContextOptions).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
    );
  });
});

describe("getOperationalContextSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads a well-formed application context cookie without querying the options list", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "client:00000000-0000-4000-8000-000000000101" }),
    } as never);

    await expect(getOperationalContextSelection()).resolves.toEqual({
      type: "client",
      clientId: "00000000-0000-4000-8000-000000000101",
    });
    expect(findOperationalContextOptions).not.toHaveBeenCalled();
  });

  it("falls back to all clients for an invalid cookie without loading options", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "client:invalid" }),
    } as never);

    await expect(getOperationalContextSelection()).resolves.toEqual({ type: "all" });
    expect(findOperationalContextOptions).not.toHaveBeenCalled();
  });
});
