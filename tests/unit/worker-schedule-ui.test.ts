import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

describe("Worker Schedule routes", () => {
  it("centralizes the authenticated Worker guard in the layout", () => {
    const layout = source("src/app/(worker-authenticated)/worker/layout.tsx");
    const home = source("src/app/(worker-authenticated)/worker/page.tsx");
    expect(layout).toContain("getAuthenticatedUser()");
    expect(layout).toContain("requireWorkerAccess()");
    expect(layout).toContain('redirect("/worker/sign-in")');
    expect(home).not.toContain("getAuthenticatedUser");
  });

  it("provides mobile Today, Schedule and entry-detail routes without OperationalContext", () => {
    const layout = source("src/app/(worker-authenticated)/worker/layout.tsx");
    const schedule = source(
      "src/app/(worker-authenticated)/worker/schedule/page.tsx",
    );
    const detail = source(
      "src/app/(worker-authenticated)/worker/schedule/[entryId]/page.tsx",
    );
    expect(layout).toContain("WorkerNavigation");
    expect(schedule).toContain("listWorkerSchedule");
    expect(detail).toContain("getWorkerScheduleEntry");
    expect(`${layout}${schedule}${detail}`).not.toContain("OperationalContext");
  });

  it("uses the Worker civil anchor only when start is absent", () => {
    const schedule = source(
      "src/app/(worker-authenticated)/worker/schedule/page.tsx",
    );
    const domain = source(
      "src/modules/worker-schedule/domain/worker-schedule.ts",
    );
    expect(schedule).toContain("getWorkerScheduleAnchorDate()");
    expect(schedule).toMatch(
      /validDate\(requestedStart\)[\s\S]*\? requestedStart[\s\S]*: await getWorkerScheduleAnchorDate\(\)/,
    );
    expect(`${schedule}${domain}`).not.toContain("currentUtcDate");
  });
});
