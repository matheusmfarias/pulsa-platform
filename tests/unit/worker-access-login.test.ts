import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Worker OTP login", () => {
  it("never creates an arbitrary account during recurring sign-in", () => {
    const repository = readFileSync(
      new URL(
        "../../src/modules/worker-access/repositories/worker-access-repository.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(repository).toMatch(
      /signInWithOtp\([\s\S]*shouldCreateUser:\s*false[\s\S]*\)/,
    );
  });

  it("keeps Worker routes outside the Backoffice route group", () => {
    const workerHome = readFileSync(
      new URL("../../src/app/(worker-authenticated)/worker/page.tsx", import.meta.url),
      "utf8",
    );
    expect(workerHome).toContain("requireWorkerAccess()");
    expect(workerHome).not.toContain("OperationalContext");
    expect(workerHome).not.toContain("requirePermission");
  });
});
