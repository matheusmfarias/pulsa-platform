import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260908150000_presence_operational_read_model.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("Presence operational read model migration", () => {
  it("selects only the current official published revision", () => {
    expect(migration).toContain("revision.status = 'published'");
    expect(migration).toContain("select max(published_revision.version)");
    expect(migration).toContain("published_revision.status = 'published'");
  });

  it("uses the Unit civil date and orders operationally", () => {
    expect(migration).toContain("(entry.starts_at at time zone unit.timezone)::date");
    expect(migration).toContain(
      "order by entry.starts_at, operation_item.name, unit.name, job_role.name",
    );
  });

  it("combines reported Absence, active Replacement and valid Presence", () => {
    expect(migration).toContain("absence.status = 'reported'");
    expect(migration).toContain("replacement.status = 'active'");
    expect(migration).toContain("presence.status in ('present', 'completed')");
    expect(migration).not.toContain("presence.status = 'cancelled'");
    expect(migration).toContain("valid_presence.actual_assignment_id");
    expect(migration).toContain("actual_worker.full_name");
    expect(migration).toContain("replacement_worker.full_name");
  });

  it("derives every state and only objective timing signals", () => {
    for (const status of [
      "awaiting_confirmation",
      "uncovered_absence",
      "replacement_expected",
      "present",
      "completed",
    ]) {
      expect(migration).toContain(`'${status}'`);
    }
    expect(migration).toContain("valid_presence.arrived_at > entry.starts_at");
    expect(migration).toContain("valid_presence.departed_at < entry.ends_at");
    expect(migration).not.toMatch(/tolerance|\blate\b|infraction/i);
  });

  it("filters client and contract in the database and requires presence:read", () => {
    expect(migration).toContain("client.id = list_presence_operational_day.target_client_id");
    expect(migration).toContain("contract.id = list_presence_operational_day.target_contract_id");
    expect(migration).toContain("'presence:read'");
    expect(migration).toContain("security definer");
    expect(migration).toContain("to authenticated");
  });
});
