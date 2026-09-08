import { describe, expect, it } from "vitest";

import {
  operationalPresenceRowSchema,
  presenceActionsFor,
  summarizeOperationalPresences,
  type OperationalPresenceRow,
} from "@/modules/presences";

const baseRow = {
  schedule_entry_id: "00000000-0000-4000-8000-000000000001",
  schedule_id: "00000000-0000-4000-8000-000000000002",
  schedule_revision_id: "00000000-0000-4000-8000-000000000003",
  planned_assignment_id: "00000000-0000-4000-8000-000000000004",
  starts_at: "2026-09-08T11:00:00Z",
  ends_at: "2026-09-08T19:00:00Z",
  client_id: "00000000-0000-4000-8000-000000000005",
  client_name: "Cliente",
  contract_id: "00000000-0000-4000-8000-000000000006",
  contract_name: "Contrato",
  operation_id: "00000000-0000-4000-8000-000000000007",
  operation_name: "Operação",
  unit_id: "00000000-0000-4000-8000-000000000008",
  unit_name: "Unidade",
  unit_timezone: "America/Sao_Paulo",
  position_id: "00000000-0000-4000-8000-000000000009",
  job_role_id: "00000000-0000-4000-8000-000000000010",
  job_role_name: "Porteiro",
  original_worker_id: "00000000-0000-4000-8000-000000000011",
  original_worker_name: "Original",
  absence_id: null,
  absence_reason: null,
  replacement_id: null,
  replacement_assignment_id: null,
  replacement_worker_id: null,
  replacement_worker_name: null,
  presence_id: null,
  presence_status: null,
  actual_assignment_id: null,
  actual_worker_id: null,
  actual_worker_name: null,
  arrived_at: null,
  departed_at: null,
  operational_status: "awaiting_confirmation",
  arrived_after_start: false,
  departed_before_end: false,
} satisfies OperationalPresenceRow;

describe("Presence operational domain", () => {
  it("parses original and replacement actual Workers", () => {
    const original = operationalPresenceRowSchema.parse({
      ...baseRow,
      presence_id: "00000000-0000-4000-8000-000000000012",
      presence_status: "present",
      actual_assignment_id: baseRow.planned_assignment_id,
      actual_worker_id: baseRow.original_worker_id,
      actual_worker_name: baseRow.original_worker_name,
      arrived_at: "2026-09-08T11:01:00Z",
      operational_status: "present",
      arrived_after_start: true,
    });
    const replacement = operationalPresenceRowSchema.parse({
      ...original,
      replacement_id: "00000000-0000-4000-8000-000000000013",
      replacement_assignment_id: "00000000-0000-4000-8000-000000000014",
      replacement_worker_id: "00000000-0000-4000-8000-000000000015",
      replacement_worker_name: "Substituto",
      actual_assignment_id: "00000000-0000-4000-8000-000000000014",
      actual_worker_id: "00000000-0000-4000-8000-000000000015",
      actual_worker_name: "Substituto",
    });
    expect(original.actual_worker_name).toBe("Original");
    expect(replacement.actual_worker_name).toBe("Substituto");
  });

  it("summarizes all operational states", () => {
    const rows = [
      "awaiting_confirmation",
      "uncovered_absence",
      "replacement_expected",
      "present",
      "completed",
    ].map((operational_status, index) => ({
      ...baseRow,
      schedule_entry_id: `00000000-0000-4000-8000-00000000002${index}`,
      operational_status,
    })) as OperationalPresenceRow[];
    expect(summarizeOperationalPresences(rows)).toEqual({
      scheduled: 5,
      awaiting: 2,
      present: 1,
      completed: 1,
      uncovered: 1,
    });
  });

  it("offers actions according to state and permission", () => {
    const operator = new Set([
      "presence:create",
      "presence:update",
      "presence:cancel",
    ] as const);
    expect(presenceActionsFor(baseRow, operator)).toEqual(["start"]);
    expect(
      presenceActionsFor({ ...baseRow, operational_status: "replacement_expected" }, operator),
    ).toEqual(["start"]);
    expect(
      presenceActionsFor({ ...baseRow, operational_status: "uncovered_absence" }, operator),
    ).toEqual(["define_coverage"]);
    expect(
      presenceActionsFor({ ...baseRow, operational_status: "present", presence_id: "00000000-0000-4000-8000-000000000012" }, operator),
    ).toEqual(["complete", "view", "correct", "cancel"]);
    expect(
      presenceActionsFor({ ...baseRow, operational_status: "completed", presence_id: "00000000-0000-4000-8000-000000000012" }, new Set(["presence:read"])),
    ).toEqual(["view"]);
  });
});
