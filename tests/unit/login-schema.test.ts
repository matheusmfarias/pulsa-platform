import { describe, expect, it } from "vitest";

import { loginSchema } from "@/modules/auth/schemas/login-schema";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "dev@example.test",
      password: "development-password",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid boundary input", () => {
    const result = loginSchema.safeParse({ email: "invalid", password: "" });

    expect(result.success).toBe(false);
  });
});
