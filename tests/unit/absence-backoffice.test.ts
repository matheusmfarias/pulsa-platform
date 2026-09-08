import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { authenticatedNavigation } from "@/components/shared/authenticated-navigation";
import { absenceActionsFor } from "@/modules/absences";
import {
  OPERATIONAL_CONTEXT_QUERY_PATHS,
  applyOperationalContextFilter,
  safePathAfterOperationalContextChange,
} from "@/modules/operational-context";
import { activeAbsenceForScheduleEntry } from "@/modules/scheduling";

const clientId = "00000000-0000-4000-8000-000000000101";
const contractId = "00000000-0000-4000-8000-000000000201";

describe("Absence Backoffice", () => {
  it("adds Ausências to Operação navigation", () => {
    expect(
      authenticatedNavigation.find((group) => group.label === "Operação")?.items,
    ).toContainEqual(
      expect.objectContaining({ href: "/app/absences", label: "Ausências" }),
    );
  });

  it("filters the Absence listing in the database for client and contract contexts", () => {
    const query = { eq: vi.fn().mockReturnThis() };
    applyOperationalContextFilter(
      query,
      { type: "client", clientId },
      OPERATIONAL_CONTEXT_QUERY_PATHS.absences,
    );
    expect(query.eq).toHaveBeenLastCalledWith(
      "schedule_entry.schedule_revision.schedule.operation.contract.client_id",
      clientId,
    );
    applyOperationalContextFilter(
      query,
      { type: "contract", clientId, contractId },
      OPERATIONAL_CONTEXT_QUERY_PATHS.absences,
    );
    expect(query.eq).toHaveBeenLastCalledWith(
      "schedule_entry.schedule_revision.schedule.operation.contract.id",
      contractId,
    );
    expect(safePathAfterOperationalContextChange("/app/absences/example")).toBe(
      "/app/absences",
    );
  });

  it("recognizes only a reported Absence as active on a ScheduleEntry", () => {
    const entry = {
      absences: [
        { id: "cancelled", reason: "personal", status: "cancelled" },
        { id: "reported", reason: "sick", status: "reported" },
      ],
    } as never;
    expect(activeAbsenceForScheduleEntry(entry)).toMatchObject({ id: "reported" });
    expect(
      activeAbsenceForScheduleEntry({
        absences: [{ id: "cancelled", reason: "personal", status: "cancelled" }],
      } as never),
    ).toBeNull();
  });

  it("exposes register and cancel actions only with their permissions", () => {
    expect(absenceActionsFor(null, new Set(["absence:create"]))).toEqual([
      "register",
    ]);
    expect(absenceActionsFor(null, new Set(["absence:read"]))).toEqual([]);
    expect(
      absenceActionsFor("reported", new Set(["absence:read", "absence:cancel"])),
    ).toEqual(["view", "cancel"]);
    expect(absenceActionsFor("reported", new Set(["absence:read"]))).toEqual([
      "view",
    ]);
  });

  it("keeps creation and cancellation wired to the existing services", () => {
    const actions = readFileSync(resolve("src/modules/absences/actions.ts"), "utf8");
    expect(actions).toContain("await createAbsence(input.data)");
    expect(actions).toContain("await cancelAbsence(input.data)");
    expect(actions).toContain('revalidatePath(`/app/scheduling/${schedule.data}`)');
  });
});
