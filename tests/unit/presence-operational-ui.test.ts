import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { authenticatedNavigation } from "@/components/shared/authenticated-navigation";
import { safePathAfterOperationalContextChange } from "@/modules/operational-context";
import { shiftPresenceDate } from "@/modules/presences/components/presence-day-navigation";

const page = readFileSync(
  resolve("src/app/(authenticated)/app/presences/page.tsx"),
  "utf8",
);
const actions = readFileSync(resolve("src/modules/presences/actions.ts"), "utf8");
const table = readFileSync(
  resolve("src/modules/presences/components/presence-operational-table.tsx"),
  "utf8",
);

describe("Supervisor operational Presence UI", () => {
  it("adds Presença to operational navigation and keeps context navigation safe", () => {
    expect(
      authenticatedNavigation.find((group) => group.label === "Operação")?.items,
    ).toContainEqual(
      expect.objectContaining({ href: "/app/presences", label: "Presença" }),
    );
    expect(safePathAfterOperationalContextChange("/app/presences")).toBe(
      "/app/presences",
    );
  });

  it("requests the selected date and supports previous, today and next navigation", () => {
    expect(page).toContain("(await searchParams).date");
    expect(page).toContain("listPresenceOperationalDay(parsedDate.data, context)");
    expect(shiftPresenceDate("2026-09-08", -1)).toBe("2026-09-07");
    expect(shiftPresenceDate("2026-09-08", 1)).toBe("2026-09-09");
  });

  it("does not offer arrival for an uncovered Absence", () => {
    expect(table).toContain('row.operational_status === "uncovered_absence"');
    expect(table).toContain("Definir cobertura");
    expect(table).toContain("PresenceControls");
  });

  it("wires arrival, departure, correction and cancellation to 6A services", () => {
    expect(actions).toContain("await startPresence({");
    expect(actions).toContain("await completePresence({");
    expect(actions).toContain("await correctPresence({");
    expect(actions).toContain("await cancelPresence({");
    expect(actions).not.toContain("actual_assignment_id");
    expect(actions).toContain("new Date().toISOString()");
    expect(actions).toContain("idempotency_key: randomUUID()");
    expect(actions).toContain('revalidatePath("/app/presences")');
  });
});
