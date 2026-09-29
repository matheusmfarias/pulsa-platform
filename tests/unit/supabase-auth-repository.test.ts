import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabaseClient } from "@/shared/db/supabase";
import { findAuthenticatedUser } from "@/modules/auth/repositories/supabase-auth-repository";

vi.mock("@/shared/db/supabase", () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe("findAuthenticatedUser", () => {
  const getClaims = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: { getClaims },
    } as never);
  });

  it("maps the identity from verified JWT claims", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "profile-123", email: "director@example.invalid" } },
      error: null,
    });

    await expect(findAuthenticatedUser()).resolves.toEqual({
      user: { id: "profile-123", email: "director@example.invalid" },
    });
    expect(getClaims).toHaveBeenCalledOnce();
  });

  it("rejects tokens without a verified subject", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { email: "director@example.invalid" } },
      error: null,
    });

    await expect(findAuthenticatedUser()).resolves.toEqual({ user: null });
  });

  it("returns an unauthenticated result when verification fails", async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: { code: "invalid_token" },
    });

    await expect(findAuthenticatedUser()).resolves.toEqual({
      user: null,
      errorCode: "invalid_token",
    });
  });
});
