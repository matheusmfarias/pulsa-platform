import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260908180000_worker_schedule_hardening.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("Worker Schedule 7B.1 hardening", () => {
  it("prioritizes an unfinished own Presence from published history", () => {
    expect(migration).toContain("private.worker_schedule_entries(true)");
    expect(migration).toContain("entry.presence_status = 'present'");
    expect(migration).toContain("select * from ongoing_presence");
    expect(migration).toContain(
      "where not exists (select 1 from ongoing_presence)",
    );
    expect(migration).not.toMatch(
      /own_historical_entries[\s\S]*presence_status\s*=\s*'completed'/,
    );
  });

  it("keeps current expectations on the official published projection", () => {
    expect(migration).toContain("private.worker_schedule_entries(false)");
    expect(migration).toContain("from official_entries entry");
    expect(migration).toContain("current_item.schedule_entry_id");
  });

  it("derives a narrow civil anchor with current, future, past priority", () => {
    expect(migration).toContain(
      "function public.get_worker_schedule_anchor_date()",
    );
    expect(migration).toContain(
      "(now() at time zone chosen_entry.unit_timezone)::date",
    );
    expect(migration).toMatch(
      /when now\(\) >= entry\.starts_at and now\(\) < entry\.ends_at then 0/,
    );
    expect(migration).toContain("when entry.starts_at > now() then 1");
    expect(migration).toContain("else 2");
    expect(migration).toContain("private.worker_schedule_entries(false)");
  });

  it("does not accept caller-selected identity and blocks public/anon", () => {
    expect(migration).toContain(
      "revoke all on function public.get_worker_schedule_anchor_date()",
    );
    expect(migration).toContain("from public, anon");
    expect(migration).toContain(
      "grant execute on function public.get_worker_schedule_anchor_date()",
    );
    expect(migration).not.toMatch(
      /get_worker_schedule_anchor_date\([^)]*(?:worker_id|organization_id)/,
    );
    expect(migration).not.toMatch(
      /alter table public\.(?:presences|absences|replacements)/,
    );
  });
});
