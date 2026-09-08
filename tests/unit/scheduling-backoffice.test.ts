import { describe, expect, it, vi } from "vitest";

import { authenticatedNavigation } from "@/components/shared/authenticated-navigation";
import { OPERATIONAL_CONTEXT_QUERY_PATHS, applyOperationalContextFilter } from "@/modules/operational-context";
import { scheduleRevisionActionsFor, selectScheduleWorkRevision } from "@/modules/scheduling";

const revision = (version: number, status: "draft" | "pending_approval" | "approved" | "published") => ({
  id: `00000000-0000-4000-8000-000000000${version.toString().padStart(3, "0")}`,
  schedule_id: "00000000-0000-4000-8000-000000000901",
  version,
  status,
  based_on_revision_id: null,
  created_at: "2026-01-01T00:00:00Z",
  created_by: "00000000-0000-4000-8000-000000000902",
  submitted_at: null,
  submitted_by: null,
  approved_at: null,
  approved_by: null,
  published_at: null,
  published_by: null,
});

describe("Scheduling Backoffice", () => {
  it("includes Escalas in the Operação navigation group", () => {
    expect(authenticatedNavigation.find((group) => group.label === "Operação")?.items).toContainEqual(expect.objectContaining({ href: "/app/scheduling", label: "Escalas" }));
  });

  it("applies OperationalContext to the Schedule query path", () => {
    const query = { eq: vi.fn().mockReturnThis() };
    applyOperationalContextFilter(query, { type: "contract", clientId: "00000000-0000-4000-8000-000000000001", contractId: "00000000-0000-4000-8000-000000000002" }, OPERATIONAL_CONTEXT_QUERY_PATHS.schedules);
    expect(query.eq).toHaveBeenCalledWith("operation.contract_id", "00000000-0000-4000-8000-000000000002");
  });

  it("prefers the most recent working revision before the published history", () => {
    expect(selectScheduleWorkRevision([revision(3, "draft"), revision(2, "published"), revision(1, "published")])?.version).toBe(3);
    expect(selectScheduleWorkRevision([revision(2, "published"), revision(1, "published")])?.version).toBe(2);
  });

  it("only exposes lifecycle actions allowed by permissions", () => {
    expect(scheduleRevisionActionsFor("pending_approval", new Set(["schedule:approve"])).map((item) => item.action)).toEqual(["approve"]);
    expect(scheduleRevisionActionsFor("published", new Set(["schedule:create"])).map((item) => item.action)).toEqual(["copy"]);
  });
});
