import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260908140000_presence_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("Presence foundation migration", () => {
  it("persists actual Assignment separately from planned and covered facts", () => {
    expect(migration).toContain("create table public.presences (");
    expect(migration).toContain("schedule_entry_id uuid not null references public.schedule_entries(id)");
    expect(migration).toContain("actual_assignment_id uuid not null references public.assignments(id)");
    expect(migration).toContain("replacement_id uuid references public.replacements(id)");
    expect(migration).not.toMatch(/update public\.(schedule_entries|absences)\s+set/i);
  });

  it("enforces lifecycle, historical cancellation and one current Presence", () => {
    expect(migration).toContain("status in ('present', 'completed', 'cancelled')");
    expect(migration).toContain("departed_at > arrived_at");
    expect(migration).toContain("presences_one_current_per_schedule_entry_idx");
    expect(migration).toContain("where status in ('present', 'completed')");
    expect(migration).toContain("Cancelled Presence is immutable");
    expect(migration).not.toMatch(/delete from public\.presences/i);
  });

  it("resolves the authoritative Assignment under locks", () => {
    expect(migration).toContain("for update of entry");
    expect(migration).toContain("and absence.status = 'reported'");
    expect(migration).toContain("and replacement.status = 'active'");
    expect(migration).toContain("resolved_assignment_id := entry_context.assignment_id");
    expect(migration).toContain("resolved_assignment_id := active_replacement.replacement_assignment_id");
    expect(migration).toContain("Presence cannot start for an uncovered Absence");
    expect(migration).toContain("replacement_context.replacement_status <> 'active'");
    expect(migration).toContain("replacement_context.absence_status <> 'reported'");
  });

  it("only starts from the current official published revision", () => {
    expect(migration).toContain("entry_context.status <> 'published'");
    expect(migration).toContain("select max(revision.version)");
    expect(migration).toContain("current published ScheduleEntry");
  });

  it("protects related Absence and Replacement history", () => {
    expect(migration).toContain("prevent_absence_after_presence");
    expect(migration).toContain("Absence cannot be reported after a valid Presence exists");
    expect(migration).toContain("prevent_replacement_cancellation_after_presence");
    expect(migration).toContain("Replacement cannot be cancelled while referenced by a valid Presence");
  });

  it("uses protected RPCs, RLS and blocks direct DML", () => {
    for (const [command, permission] of [
      ["start_presence", "presence:create"],
      ["complete_presence", "presence:update"],
      ["correct_presence", "presence:update"],
      ["cancel_presence", "presence:cancel"],
    ]) {
      expect(migration).toContain(`create or replace function public.${command}(`);
      expect(migration).toContain(`'${permission}'`);
    }
    expect(migration).toContain("alter table public.presences enable row level security");
    expect(migration).toContain("has_organization_permission(organization_id, 'presence:read')");
    expect(migration).toContain("revoke all on table public.presences from anon, authenticated");
    expect(migration).toContain("grant select on table public.presences to authenticated");
  });

  it("records atomic audit and minimal idempotency receipts", () => {
    expect(migration).toContain("create table private.presence_command_receipts (");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("Presence idempotency key was reused");
    for (const action of ["record_arrival", "record_departure", "correct", "cancel"]) {
      expect(migration).toContain(`'${action}'`);
    }
  });
});
