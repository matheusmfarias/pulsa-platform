import { describe, expect, it } from "vitest";

import { createScheduleSchema, scheduleEntryInputSchema } from "@/modules/scheduling";

const ids = {
  organization_id: "00000000-0000-4000-8000-000000000001",
  operation_id: "00000000-0000-4000-8000-000000000101",
  schedule_revision_id: "00000000-0000-4000-8000-000000000201",
  assignment_id: "00000000-0000-4000-8000-000000000301",
};

describe("Scheduling schemas", () => {
  it("validates an explicit Schedule period", () => {
    expect(createScheduleSchema.safeParse({ ...ids, period_start: "2026-09-01", period_end: "2026-09-30" }).success).toBe(true);
    expect(createScheduleSchema.safeParse({ ...ids, period_start: "2026-09-30", period_end: "2026-09-01" }).success).toBe(false);
  });

  it("requires a complete break strictly inside an Entry", () => {
    const input = {
      schedule_revision_id: ids.schedule_revision_id,
      assignment_id: ids.assignment_id,
      starts_at: "2026-09-10T08:00:00.000Z",
      ends_at: "2026-09-10T17:00:00.000Z",
      break_starts_at: "2026-09-10T12:00:00.000Z",
      break_ends_at: "2026-09-10T13:00:00.000Z",
    };
    expect(scheduleEntryInputSchema.safeParse(input).success).toBe(true);
    expect(scheduleEntryInputSchema.safeParse({ ...input, break_ends_at: null }).success).toBe(false);
    expect(scheduleEntryInputSchema.safeParse({ ...input, break_starts_at: "2026-09-10T07:00:00.000Z" }).success).toBe(false);
  });
});
