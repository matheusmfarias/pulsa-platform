import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimMyWorkerAccess: vi.fn(),
  claimWorkerAccess: vi.fn(),
  getMyWorkerAccessHistoryState: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/modules/auth/services/authenticate", () => ({
  authenticate: vi.fn(),
}));
vi.mock("@/modules/auth/services/sign-out", () => ({ signOut: vi.fn() }));
vi.mock("@/modules/worker-access/services/claim-worker-access", () => ({
  claimMyWorkerAccess: mocks.claimMyWorkerAccess,
  claimWorkerAccess: mocks.claimWorkerAccess,
  getMyWorkerAccessHistoryState: mocks.getMyWorkerAccessHistoryState,
}));
vi.mock(
  "@/modules/worker-access/services/worker-access-administration",
  () => ({
    provisionWorkerAccess: vi.fn(),
    resumeWorkerAccess: vi.fn(),
    revokeWorkerAccess: vi.fn(),
    revokeWorkerAccessInvitation: vi.fn(),
    suspendWorkerAccess: vi.fn(),
  }),
);
vi.mock("@/modules/worker-access/services/worker-auth", () => ({
  requestWorkerOtp: vi.fn(),
  requestWorkerPasswordReset: vi.fn(),
  verifyWorkerOtp: vi.fn(),
}));

import {
  claimMyWorkerAccessAction,
  claimWorkerAccessAction,
} from "@/modules/worker-access/actions";
import { getWorkerClaimExperience } from "@/modules/worker-access/domain/worker-access";

describe("WorkerAccess history claim flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats an account without WorkerAccess history as first access", async () => {
    mocks.getMyWorkerAccessHistoryState.mockResolvedValue(false);

    const experience = getWorkerClaimExperience(false);
    await claimWorkerAccessAction("a".repeat(64));

    expect(experience).toMatchObject({
      eyebrow: "Primeiro acesso",
      title: "Confirme seu acesso",
      submitLabel: "Ativar meu acesso",
      redirectTo: "/worker/set-password",
    });
    expect(mocks.getMyWorkerAccessHistoryState).toHaveBeenCalledOnce();
    expect(mocks.claimWorkerAccess).toHaveBeenCalledWith("a".repeat(64));
    expect(mocks.redirect).toHaveBeenLastCalledWith("/worker/set-password");
  });

  it("treats a revoked historical WorkerAccess as reactivation", async () => {
    const historicalLinks = [{ status: "revoked" }];
    mocks.getMyWorkerAccessHistoryState.mockResolvedValue(
      historicalLinks.length > 0,
    );

    const experience = getWorkerClaimExperience(historicalLinks.length > 0);
    await claimMyWorkerAccessAction();

    expect(experience).toMatchObject({
      eyebrow: "Reativação de acesso",
      title: "Confirme a reativação",
      submitLabel: "Reativar meu acesso",
      redirectTo: "/worker",
    });
    expect(mocks.getMyWorkerAccessHistoryState).toHaveBeenCalledOnce();
    expect(mocks.claimMyWorkerAccess).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenLastCalledWith("/worker");
  });

  it("ignores a generated Auth password when no WorkerAccess history exists", () => {
    const provisionedAuthUser = {
      encryptedPassword: "random-password-created-by-supabase-admin",
    };

    const experience = getWorkerClaimExperience(false);

    expect(provisionedAuthUser.encryptedPassword).not.toBe("");
    expect(experience.eyebrow).toBe("Primeiro acesso");
    expect(experience.redirectTo).toBe("/worker/set-password");
  });
});
