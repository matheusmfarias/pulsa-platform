import { describe, expect, it } from "vitest";

import {
  workerIdSchema,
  workerInputSchema,
  workerStatusSchema,
} from "@/modules/workers";

const validInput = {
  full_name: " Pessoa Fictícia ",
  document_number: "529.982.247-25",
  email: " worker@example.invalid ",
  phone: " (11) 90000-0000 ",
  engagement_start_date: "2026-01-01",
  engagement_end_date: "2026-12-31",
};

describe("worker schemas", () => {
  it("normalizes CPF and optional text", () => {
    expect(workerInputSchema.parse(validInput)).toEqual({
      ...validInput,
      full_name: "Pessoa Fictícia",
      document_number: "52998224725",
      email: "worker@example.invalid",
      phone: "(11) 90000-0000",
    });
  });

  it("normalizes empty optional fields to null", () => {
    expect(
      workerInputSchema.parse({
        ...validInput,
        email: "",
        phone: "",
        engagement_start_date: "",
        engagement_end_date: "",
      }),
    ).toMatchObject({
      email: null,
      phone: null,
      engagement_start_date: null,
      engagement_end_date: null,
    });
  });

  it("rejects an end date before the start date", () => {
    const result = workerInputSchema.safeParse({
      ...validInput,
      engagement_start_date: "2026-02-01",
      engagement_end_date: "2026-01-31",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.engagement_end_date,
      ).toContain("A data final não pode ser anterior à data inicial.");
    }
  });

  it("validates CPF, email, UUID and status", () => {
    expect(
      workerInputSchema.safeParse({ ...validInput, document_number: "123" })
        .success,
    ).toBe(false);
    expect(
      workerInputSchema.safeParse({ ...validInput, email: "invalid" }).success,
    ).toBe(false);
    expect(workerIdSchema.safeParse("invalid").success).toBe(false);
    expect(workerStatusSchema.safeParse("deleted").success).toBe(false);
  });
});
