import { describe, expect, it } from "vitest";
import { positionGlobalListFiltersSchema, positionIdSchema, positionInputSchema, positionStatusSchema } from "@/modules/positions";

const valid = { unit_id: "00000000-0000-4000-8000-000000000401", job_role_id: "00000000-0000-4000-8000-000000000451", description: " Atendimento ", base_required_headcount: "4" };
describe("position schemas", () => {
  it("normalizes fields and coerces an integer headcount", () => {
    expect(positionInputSchema.parse(valid)).toMatchObject({ job_role_id: valid.job_role_id, description: "Atendimento", base_required_headcount: 4 });
  });
  it.each([-1, 1.5])("rejects invalid headcount %s", (headcount) => {
    expect(positionInputSchema.safeParse({ ...valid, base_required_headcount: headcount }).success).toBe(false);
  });
  it("validates UUID and status", () => {
    expect(positionIdSchema.safeParse("invalid").success).toBe(false);
    expect(positionStatusSchema.safeParse("archived").success).toBe(false);
  });
  it("accepts the global-list filters without changing position input rules", () => {
    expect(positionGlobalListFiltersSchema.parse({ query: "Promotor", status: "active" })).toEqual({ query: "Promotor", status: "active" });
  });
});
