import { describe, expect, it } from "vitest";

import { AppError, toPublicErrorMessage } from "@/shared/errors";

describe("toPublicErrorMessage", () => {
  it("keeps safe application messages", () => {
    const error = new AppError("CONFLICT", "Registro já existe.");

    expect(toPublicErrorMessage(error)).toBe("Registro já existe.");
  });

  it("hides infrastructure details", () => {
    const error = new AppError("INFRASTRUCTURE", "database-host.internal refused");

    expect(toPublicErrorMessage(error)).toBe(
      "Não foi possível concluir a operação. Tente novamente.",
    );
  });

  it("hides unknown error details", () => {
    expect(toPublicErrorMessage(new Error("secret detail"))).toBe(
      "Não foi possível concluir a operação. Tente novamente.",
    );
  });
});
