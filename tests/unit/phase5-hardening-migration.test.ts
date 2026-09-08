import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../../supabase/migrations/20260908110000_phase5_hardening.sql", import.meta.url), "utf8");

describe("Phase 5 H1 hardening", () => {
  it("requires the current official published revision for Absence", () => {
    expect(migration).toContain("r.status='published'");
    expect(migration).toContain("select max(pr.version)");
    expect(migration).toContain("current published ScheduleEntry");
  });
  it("blocks cancellation with active coverage", () => {
    expect(migration).toContain("r.absence_id=old_item.id and r.status='active'");
    expect(migration).toContain("Cancele a substituição ativa antes de cancelar a ausência.");
  });
  it("aligns candidate conflicts to pending, approved and official published revisions", () => {
    expect(migration).toContain("r.status in ('pending_approval','approved')");
    expect(migration).toContain("r.status='published' and r.version=(select max(pr.version)");
    expect(migration).toContain("z.status='active'");
    expect(migration).toContain("x.end_date is null");
  });
});
