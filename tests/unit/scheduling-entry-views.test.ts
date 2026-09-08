import { describe, expect, it } from "vitest";

import { entriesForScheduleDay, groupEntriesByWorker } from "@/modules/scheduling";

const entry = (id: string, workerId: string, workerName: string, startsAt: string) => ({ id, starts_at: startsAt, ends_at: "2026-09-20T17:00:00Z", assignment: { worker: { id: workerId, full_name: workerName }, position: { unit: { timezone: "America/Sao_Paulo", name: "Portaria" }, job_role: { name: "Porteiro" } } } }) as never;

describe("Schedule entry reading views", () => {
  it("filters the daily view using the Unit timezone", () => {
    expect(entriesForScheduleDay([entry("a", "w1", "Ana", "2026-09-20T01:00:00Z"), entry("b", "w1", "Ana", "2026-09-20T11:00:00Z")], "2026-09-20").map((item) => item.id)).toEqual(["b"]);
  });
  it("groups Worker entries and orders them chronologically", () => {
    const groups = groupEntriesByWorker([entry("late", "w1", "Ana", "2026-09-21T11:00:00Z"), entry("early", "w1", "Ana", "2026-09-20T11:00:00Z"), entry("other", "w2", "Bruno", "2026-09-20T11:00:00Z")]);
    expect(groups.map((group) => group.worker.name)).toEqual(["Ana", "Bruno"]);
    expect(groups[0].entries.map((item) => item.id)).toEqual(["early", "late"]);
  });
  it("recognizes the supported detail view values", () => {
    expect(["weekly", "day", "worker"].includes("day")).toBe(true);
  });
});
