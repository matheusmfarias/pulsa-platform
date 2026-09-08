import { describe, expect, it } from "vitest";

import { buildSchedulePositionGroups, eligibleAssignmentsForDate, isScheduleRevisionEditable, resolveScheduleWeekStart, scheduleWeekDays } from "@/modules/scheduling";

const assignment = (id: string, start_date: string, end_date: string | null, status = "active") => ({ id, start_date, end_date, status, position: { id: "position-1", job_role: { name: "Porteiro" }, unit: { id: "unit-1", name: "Portaria", operation: { id: "operation-1", name: "Operação", contract: { id: "contract-1", name: "Contrato", client: { id: "client-1", trade_name: "Cliente", organization_id: "org" } } } } }, worker: { id: "worker", full_name: "Ana", status: "active", organization_id: "org" } }) as never;

describe("weekly Scheduling editor", () => {
  it("uses Monday as the start and keeps seven days", () => {
    expect(resolveScheduleWeekStart("2026-09-01", "2026-09-30")).toBe("2026-08-31");
    expect(scheduleWeekDays("2026-08-31")).toHaveLength(7);
  });
  it("groups active Assignment positions by Unit", () => {
    const groups = buildSchedulePositionGroups([], [assignment("a", "2026-09-01", null)], "2026-08-31");
    expect(groups).toMatchObject([{ unit: { name: "Portaria" }, position: { name: "Porteiro" } }]);
  });
  it("only exposes draft revisions as editable", () => {
    expect(isScheduleRevisionEditable("draft")).toBe(true);
    expect(isScheduleRevisionEditable("published")).toBe(false);
  });
  it("accepts pending and active Assignment coverage for the date", () => {
    const eligible = eligibleAssignmentsForDate([
      assignment("a", "2026-09-15", null, "pending"),
      assignment("b", "2026-09-01", "2026-09-30", "active"),
      assignment("c", "2026-09-01", null, "suspended"),
    ], "2026-09-20");
    expect(eligible.map((item) => item.id)).toEqual(["a", "b"]);
  });
});
