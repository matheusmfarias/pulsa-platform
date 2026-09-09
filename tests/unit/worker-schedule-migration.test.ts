import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260908170000_worker_schedule_read_model.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("Worker Schedule read model migration", () => {
  it("exposes only narrow RPCs without caller-selected principal IDs", () => {
    expect(migration).toContain("function public.get_worker_home()");
    expect(migration).toContain(
      "function public.list_worker_schedule(\n  from_date date,\n  to_date date",
    );
    expect(migration).toContain("function public.get_worker_schedule_entry(");
    expect(migration).not.toMatch(
      /function public\.(?:get_worker_home|list_worker_schedule|get_worker_schedule_entry)\([^)]*(?:worker_id|organization_id)/,
    );
    expect(migration).toContain("from private.require_worker_access()");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
  });

  it("uses only the greatest published revision for current expectations", () => {
    expect(migration).toContain("revision.status = 'published'");
    expect(migration).toContain("max(revision.version) as version");
    expect(migration).toContain("revision.version = latest_published.version");
    expect(migration).not.toMatch(/revision\.status\s+in\s*\([^)]*draft/);
  });

  it("classifies original, replacement and own Presence without persisting lifecycle", () => {
    for (const status of [
      "original_expected",
      "replacement_expected",
      "original_absent",
      "original_replaced",
      "completed",
      "in_progress",
    ]) {
      expect(migration).toContain(`'${status}'`);
    }
    expect(migration).toContain("presence.status in ('present', 'completed')");
    expect(migration).not.toMatch(/alter table public\.(?:schedule_entries|presences)/);
  });

  it("filters civil dates in each Unit timezone and limits ranges", () => {
    expect(migration).toContain("entry.starts_at at time zone unit.timezone");
    expect(migration).toContain("now() at time zone entry.unit_timezone");
    expect(migration).toContain("select 'today'::text as home_slot");
    expect(migration).toContain("to_date - from_date > 30");
  });

  it("does not expose administrative or third-party fields", () => {
    const returnFields = migration.slice(
      migration.indexOf("returns table ("),
      migration.indexOf(")\nlanguage sql"),
    );
    for (const forbidden of [
      "client",
      "contract",
      "assignment_id",
      "absence_id",
      "replacement_id",
      "notes",
      "headcount",
    ]) {
      expect(returnFields).not.toContain(forbidden);
    }
    expect(returnFields).not.toMatch(/\n\s*worker_id\s/);
  });
});
