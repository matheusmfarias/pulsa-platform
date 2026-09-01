import { describe, expect, it } from "vitest";

import {
  operationIdSchema,
  operationInputSchema,
} from "@/modules/operations";

const validInput = {
  contract_id: "00000000-0000-4000-8000-000000000201",
  name: " Operação de Desenvolvimento ",
  description: " Operação fictícia para testes. ",
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  manager_user_id: "00000000-0000-4000-8000-000000000401",
};

describe("operation schemas", () => {
  it("normalizes text and accepts a valid period", () => {
    expect(operationInputSchema.parse(validInput)).toEqual({
      ...validInput,
      name: "Operação de Desenvolvimento",
      description: "Operação fictícia para testes.",
    });
  });

  it("normalizes optional fields to null", () => {
    expect(
      operationInputSchema.parse({
        ...validInput,
        description: " ",
        end_date: "",
        manager_user_id: "",
      }),
    ).toMatchObject({
      description: null,
      end_date: null,
      manager_user_id: null,
    });
  });

  it("rejects an end date before the start date", () => {
    const result = operationInputSchema.safeParse({
      ...validInput,
      start_date: "2026-02-01",
      end_date: "2026-01-31",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.end_date).toContain(
        "A data final não pode ser anterior à data inicial.",
      );
    }
  });

  it("validates operation, contract and manager UUIDs", () => {
    expect(operationIdSchema.safeParse("invalid").success).toBe(false);
    expect(
      operationInputSchema.safeParse({ ...validInput, contract_id: "invalid" })
        .success,
    ).toBe(false);
    expect(
      operationInputSchema.safeParse({
        ...validInput,
        manager_user_id: "invalid",
      }).success,
    ).toBe(false);
  });
});
