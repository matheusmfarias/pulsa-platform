import { describe, expect, it } from "vitest";

import { copyScheduleEntriesToPeriod, copyScheduleEntryToDays, zonedCivilDateTime, type ScheduleEntryWithContext } from "@/modules/scheduling";

const entry = (overrides: Record<string, unknown> = {}) => ({
  id: "00000000-0000-4000-8000-000000000601",
  assignment_id: "00000000-0000-4000-8000-000000000701",
  schedule_revision_id: "00000000-0000-4000-8000-000000000501",
  starts_at: "2026-09-07T11:00:00.000Z",
  ends_at: "2026-09-07T20:00:00.000Z",
  break_starts_at: "2026-09-07T15:00:00.000Z",
  break_ends_at: "2026-09-07T16:00:00.000Z",
  created_at: "2026-01-01T00:00:00.000Z",
  created_by: "00000000-0000-4000-8000-000000000801",
  assignment: {
    id: "00000000-0000-4000-8000-000000000701", worker_id: "worker", position_id: "position", start_date: "2026-09-01", end_date: null, status: "active",
    worker: { id: "worker", full_name: "Ana", status: "active" },
    position: { id: "position", status: "active", job_role: { id: "role", name: "Porteiro" }, unit: { id: "unit", name: "Portaria", timezone: "America/Sao_Paulo", operation: { id: "operation", name: "Operação" } } },
  },
  ...overrides,
}) as ScheduleEntryWithContext;

describe("Schedule copy", () => {
  it("shifts civil dates while preserving local hours and the break", () => {
    const result = copyScheduleEntriesToPeriod([entry()], "2026-09-01", "2026-10-01", "2026-10-31");
    expect(result.skipped).toBe(0);
    expect(result.copied).toHaveLength(1);
    const copied = result.copied[0];
    expect(zonedCivilDateTime(copied.starts_at, "America/Sao_Paulo")).toEqual({ date: "2026-10-07", time: "08:00" });
    expect(zonedCivilDateTime(copied.ends_at, "America/Sao_Paulo")).toEqual({ date: "2026-10-07", time: "17:00" });
    expect(zonedCivilDateTime(copied.break_starts_at!, "America/Sao_Paulo").time).toBe("12:00");
    expect(zonedCivilDateTime(copied.break_ends_at!, "America/Sao_Paulo").time).toBe("13:00");
  });

  it("leaves out Assignments that are no longer eligible in the target period", () => {
    const unavailable = entry({ assignment: { ...entry().assignment, status: "finished", end_date: "2026-09-30" } });
    const result = copyScheduleEntriesToPeriod([unavailable], "2026-09-01", "2026-10-01", "2026-10-31");
    expect(result).toMatchObject({ copied: [], skipped: 1 });
  });

  it("copies one Entry to multiple eligible days and ignores days outside the period", () => {
    const result = copyScheduleEntryToDays(entry(), ["2026-09-08", "2026-09-09", "2026-10-01"], "2026-09-01", "2026-09-30");
    expect(result).toMatchObject({ skipped: 1 });
    expect(result.copied).toHaveLength(2);
    expect(zonedCivilDateTime(result.copied[1].starts_at, "America/Sao_Paulo").date).toBe("2026-09-09");
  });
});
