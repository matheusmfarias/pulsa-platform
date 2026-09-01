import { describe, expect, it } from "vitest";

import { assignmentInputSchema } from "@/modules/assignments/schemas/assignment-schemas";

const valid = {
  worker_id: "00000000-0000-4000-8000-000000000101",
  position_id: "00000000-0000-4000-8000-000000000201",
  start_date: "2026-09-01",
  end_date: "2026-09-30",
};

describe("assignmentInputSchema", () => {
  it("accepts valid UUIDs and an optional open-ended period", () => {
    expect(assignmentInputSchema.parse({ ...valid, end_date: "" })).toMatchObject({
      end_date: null,
    });
  });

  it("rejects an end date before the start date", () => {
    const result = assignmentInputSchema.safeParse({ ...valid, end_date: "2026-08-31" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid parent identifiers", () => {
    expect(assignmentInputSchema.safeParse({ ...valid, worker_id: "invalid" }).success).toBe(false);
    expect(assignmentInputSchema.safeParse({ ...valid, position_id: "invalid" }).success).toBe(false);
  });
});
