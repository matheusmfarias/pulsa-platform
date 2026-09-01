import { describe, expect, it } from "vitest";

import {
  formatCpf,
  isValidCpf,
  normalizeCpf,
} from "@/modules/workers";

describe("worker CPF", () => {
  it("normalizes and formats a CPF", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  it.each(["529.982.247-25", "10000000108"])(
    "accepts valid CPF %s",
    (cpf) => expect(isValidCpf(cpf)).toBe(true),
  );

  it.each(["111.111.111-11", "529.982.247-24", "123"])(
    "rejects invalid CPF %s",
    (cpf) => expect(isValidCpf(cpf)).toBe(false),
  );
});
