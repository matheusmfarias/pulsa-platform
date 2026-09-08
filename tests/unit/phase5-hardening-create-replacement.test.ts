import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../../supabase/migrations/20260908120000_phase5_hardening_create_replacement.sql", import.meta.url), "utf8");

describe("H1.1 create_replacement", () => {
  it("uses pending, approved and only the current published revision for conflicts", () => {
    expect(migration).toContain("create or replace function private.create_replacement");
    expect(migration).toContain("r.status in ('pending_approval','approved')");
    expect(migration).toContain("select max(pr.version)");
    expect(migration).toContain("private.replacement_schedule_entry_conflict");
    expect(migration).toContain("Replacement Worker has a Replacement conflict");
  });
});
