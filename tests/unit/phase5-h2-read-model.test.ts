import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/20260908130000_phase5_uncovered_absence_read_model.sql"),
  "utf8",
);
const home = readFileSync(resolve("src/app/(authenticated)/app/page.tsx"), "utf8");
const service = readFileSync(
  resolve("src/modules/absences/services/absence-services.ts"),
  "utf8",
);

describe("Phase 5 H2 uncovered Absence read model", () => {
  it("selects reported Absences without an active Replacement", () => {
    expect(migration).toContain("absence.status = 'reported'");
    expect(migration).toContain("not exists (");
    expect(migration).toContain("replacement.status = 'active'");
  });

  it("orders before applying the database limit", () => {
    expect(migration.indexOf("order by entry.starts_at asc")).toBeLessThan(
      migration.indexOf("limit coalesce(result_limit"),
    );
  });

  it("preserves client and contract context and limits Home to three", () => {
    expect(migration).toContain("contract.client_id = list_uncovered_absence_ids.client_id");
    expect(migration).toContain("contract.id = list_uncovered_absence_ids.contract_id");
    expect(home).toContain("{ withoutCoverage: true, limit: 3 }");
    expect(service).not.toContain("absences.filter(isAbsenceWithoutCoverage)");
  });
});
