import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260908100000_replacement_foundation.sql", import.meta.url),
  "utf8",
);

describe("Replacement foundation migration", () => {
  it("keeps one active replacement linked to an absence and its replacement Entry", () => {
    expect(migration).toContain("create table public.replacements (");
    expect(migration).toContain("absence_id uuid not null references public.absences(id) on delete restrict");
    expect(migration).toContain("replacement_assignment_id uuid not null references public.assignments(id) on delete restrict");
    expect(migration).toContain("status in ('active','cancelled')");
    expect(migration).toContain("on public.replacements(absence_id) where status = 'active'");
  });

  it("uses organization-scoped RLS and protected RPC mutations", () => {
    expect(migration).toContain("alter table public.replacements enable row level security");
    expect(migration).toContain("has_organization_permission(organization_id, 'replacement:read')");
    expect(migration).toContain("revoke all on table public.replacements from anon, authenticated");
    expect(migration).toContain("private.require_organization_permission(create_replacement.organization_id,'replacement:create')");
    expect(migration).toContain("private.require_organization_permission(cancel_replacement.organization_id,'replacement:cancel')");
  });

  it("creates and cancels the substitute Entry inside database functions with audit", () => {
    expect(migration).not.toContain("private.create_schedule_entry");
    expect(migration).not.toContain("private.delete_schedule_entry");
    expect(migration).toContain("'replacement',item.id,'create'");
    expect(migration).toContain("'replacement',item.id,'cancel'");
  });

  it("enforces reported absences, eligibility and prevents cross-organization access", () => {
    expect(migration).toContain("Only a reported Absence can be replaced");
    expect(migration).toContain("candidate.position_id<>c.position_id");
    expect(migration).toContain("candidate.status not in ('pending','active')");
    expect(migration).toContain("candidate.worker_id=c.absent_worker");
    expect(migration).toContain("Absence belongs to another Organization");
    expect(migration).toContain("organization_id=create_replacement.organization_id");
  });
});
