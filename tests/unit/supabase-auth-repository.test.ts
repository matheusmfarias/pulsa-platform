import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClient, getClaims } = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getClaims: vi.fn(),
}));

vi.mock("@/shared/db/supabase", () => ({ createServerSupabaseClient }));

import { findAuthenticatedUser } from "@/modules/auth/repositories/supabase-auth-repository";

describe("findAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerSupabaseClient.mockResolvedValue({ auth: { getClaims } });
  });

  it("returns identity from verified claims", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", email: "director@example.com" } },
      error: null,
    });

    await expect(findAuthenticatedUser()).resolves.toEqual({
      user: { id: "user-1", email: "director@example.com" },
    });
    expect(getClaims).toHaveBeenCalledOnce();
  });

  it("returns no identity when claims are absent or invalid", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    await expect(findAuthenticatedUser()).resolves.toEqual({ user: null });

    getClaims.mockResolvedValue({
      data: { claims: { email: "director@example.com" } },
      error: null,
    });
    await expect(findAuthenticatedUser()).resolves.toEqual({ user: null });
  });

  it("preserves the auth error code", async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: { code: "session_not_found" },
    });

    await expect(findAuthenticatedUser()).resolves.toEqual({
      user: null,
      errorCode: "session_not_found",
    });
  });
});
