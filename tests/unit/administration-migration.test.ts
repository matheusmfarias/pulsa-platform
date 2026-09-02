import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/20260901100000_administration_foundation.sql"),
  "utf8",
);

describe("administration migration", () => {
  it("keeps the TypeScript and PostgreSQL administrative permissions aligned", () => {
    expect(migration).toContain("'organization_member:read'");
    expect(migration).toContain("'organization_member:update'");
    expect(migration).toContain("'audit:read'");
    expect(migration.match(/'audit:read'/g)).toHaveLength(2);
  });

  it("protects membership mutation database-side and preserves the last active DIRECTOR", () => {
    expect(migration).toContain("private.require_organization_permission");
    expect(migration).toContain("'organization_member:update'");
    expect(migration).toContain("for update;");
    expect(migration).toContain("remaining_active_directors = 0");
    expect(migration).toContain("Organization must keep at least one active DIRECTOR");
    expect(migration).toContain("'membership_change'");
    expect(migration).toContain("revoke insert, update, delete on public.organization_members");
  });

  it("exposes audit reads only through organization-scoped RLS", () => {
    expect(migration).toContain("Administrators can read organization audit events");
    expect(migration).toContain("has_organization_permission(organization_id, 'audit:read')");
    expect(migration).toContain("grant select on public.audit_events to authenticated");
  });
});
