import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260901090000_job_roles.sql", import.meta.url),
  "utf8",
);

describe("job role migration", () => {
  it("backfills by organization with predictable trim/case deduplication", () => {
    expect(migration).toContain("distinct on (");
    expect(migration).toContain("client.organization_id");
    expect(migration).toContain("lower(btrim(position.title))");
    expect(migration).toContain("order by");
    expect(migration).toContain("position.created_at");
  });

  it("makes the relationship mandatory before removing the legacy title", () => {
    const notNull = migration.indexOf("alter column job_role_id set not null");
    const dropTitle = migration.indexOf("drop column title");
    expect(notNull).toBeGreaterThan(-1);
    expect(dropTitle).toBeGreaterThan(notNull);
    expect(migration).toContain("foreign key (job_role_id)");
  });

  it("keeps Position and Cargo history protected in the database", () => {
    expect(migration).toContain("new.job_role_id is distinct from old.job_role_id");
    expect(migration).toContain("new.name is distinct from old.name");
    expect(migration).toContain("histórico de Assignments");
  });

  it("only accepts an active JobRole for a new Position relationship", () => {
    expect(migration).toContain("job_role_status <> 'active'");
    expect(migration).toContain("A Position só pode ser vinculada a um Cargo ativo.");
  });
});
