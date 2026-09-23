import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260923120000_schedule_absence_continuity.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("Schedule Absence continuity migration", () => {
  it("repairs current published entries and carries the existing Absence reference into revisions", () => {
    expect(migration).toContain("add column inherited_absence_id uuid");
    expect(migration).toContain("revision.based_on_revision_id");
    expect(migration).toContain("coalesce(direct_absence.id, inherited_absence.id)");
    expect(migration).toContain("'create_from_published'");
    expect(migration).toContain("entry.inherited_absence_id");
    expect(migration).toContain("new.inherited_absence_id := null");
    expect(migration).toContain("new.break_starts_at is not distinct from old.break_starts_at");
    expect(migration).toContain("return new;");
  });

  it("uses inherited absence and active coverage in Worker and operational projections", () => {
    expect(migration).toContain("function private.worker_schedule_entries(");
    expect(migration).toContain("function public.get_worker_presence_action(");
    expect(migration).toContain("function public.list_presence_operational_day(");
    expect(migration.match(/absence\.id = entry\.inherited_absence_id/g)?.length).toBeGreaterThanOrEqual(3);
    expect(migration).toContain("presence.actual_assignment_id = case");
    expect(migration).toContain("presence.actual_assignment_id = (");
    expect(migration).toContain("presence.replacement_id is null");
    expect(migration).toContain("replacement.id = presence.replacement_id");
  });

  it("blocks original-worker presence and permits only the active replacement context", () => {
    expect(migration).toContain("function private.start_presence_core(");
    expect(migration).toContain("absence.id = entry_context.inherited_absence_id");
    expect(migration).toContain("function private.enforce_presence_context()");
    expect(migration).toContain("replacement_context.absence_id <> inherited_absence_id");
    expect(migration).toContain("ScheduleEntry already inherits a reported Absence");
  });
});
