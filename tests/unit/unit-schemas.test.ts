import { describe, expect, it } from "vitest";
import { unitIdSchema, unitInputSchema, unitStatusSchema } from "@/modules/units";

const valid = {
  operation_id: "00000000-0000-4000-8000-000000000301",
  name: " Unidade Centro ",
  code: " centro ",
  address: " Rua Exemplo, 100 ",
  city: " São Paulo ",
  state: " SP ",
  timezone: "America/Sao_Paulo",
};

describe("unit schemas", () => {
  it("normalizes unit fields and code", () => {
    expect(unitInputSchema.parse(valid)).toMatchObject({ name: "Unidade Centro", code: "CENTRO", city: "São Paulo" });
  });
  it("normalizes optional fields to null", () => {
    expect(unitInputSchema.parse({ ...valid, code: "", address: "", city: "", state: "" })).toMatchObject({ code: null, address: null, city: null, state: null });
  });
  it("rejects an invalid timezone", () => {
    expect(unitInputSchema.safeParse({ ...valid, timezone: "Brazil/Imaginary" }).success).toBe(false);
  });
  it("validates UUID and status", () => {
    expect(unitIdSchema.safeParse("invalid").success).toBe(false);
    expect(unitStatusSchema.safeParse("archived").success).toBe(false);
  });
});
