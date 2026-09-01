import { describe, expect, it } from "vitest";

import {
  contractIdSchema,
  contractInputSchema,
} from "@/modules/contracts";

const validInput = {
  client_id: "00000000-0000-4000-8000-000000000101",
  name: " Contrato de Desenvolvimento ",
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  external_reference: " DEV-CONTRACT-001 ",
};

describe("contract schemas", () => {
  it("normalizes text and accepts a valid period", () => {
    expect(contractInputSchema.parse(validInput)).toEqual({
      ...validInput,
      name: "Contrato de Desenvolvimento",
      external_reference: "DEV-CONTRACT-001",
    });
  });

  it("normalizes optional empty fields to null", () => {
    expect(
      contractInputSchema.parse({
        ...validInput,
        end_date: "",
        external_reference: "  ",
      }),
    ).toMatchObject({ end_date: null, external_reference: null });
  });

  it("rejects an end date before the start date", () => {
    const result = contractInputSchema.safeParse({
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

  it("validates contract and client UUIDs", () => {
    expect(contractIdSchema.safeParse("invalid").success).toBe(false);
    expect(
      contractInputSchema.safeParse({ ...validInput, client_id: "invalid" }).success,
    ).toBe(false);
  });
});
