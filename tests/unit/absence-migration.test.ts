import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260904110000_absence_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);

function publicFunction(name: string) {
  const match = migration.match(
    new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`),
  );
  expect(match, `public function ${name}`).not.toBeNull();
  return match![0];
}

describe("Absence foundation migration", () => {
  it("creates only the requested Absence foundation", () => {
    expect(migration).toContain("create table public.absences (");
    expect(migration).toContain("schedule_entry_id uuid not null");
    expect(migration).toContain("references public.schedule_entries(id) on delete restrict");
    expect(migration).toContain("status text not null default 'reported'");
    expect(migration).not.toMatch(
      /create table public\.(replacements|reservations|availability|attendance)/,
    );
  });

  it("constrains V1 reasons and statuses", () => {
    for (const reason of [
      "sick",
      "medical_certificate",
      "personal",
      "no_show",
      "other",
    ]) {
      expect(migration).toContain(`'${reason}'`);
    }
    expect(migration).toContain("status in ('reported', 'cancelled')");
  });

  it("allows at most one reported Absence per ScheduleEntry", () => {
    expect(migration).toContain(
      "create unique index absences_one_reported_per_schedule_entry_idx",
    );
    expect(migration).toContain("on public.absences (schedule_entry_id)");
    expect(migration).toContain("where status = 'reported'");
  });

  it("validates that Absence and ScheduleEntry share an Organization", () => {
    const createFunction = publicFunction("create_absence");
    expect(createFunction).toContain("private.schedule_entry_organization_id");
    expect(createFunction).toContain(
      "entry_organization_id <> create_absence.organization_id",
    );
    expect(createFunction).toContain(
      "Absence and ScheduleEntry must belong to the same Organization",
    );
    expect(migration).toContain("enforce_absence_schedule_entry_organization");
  });

  it("protects mutations with the matching database permission", () => {
    expect(publicFunction("create_absence")).toContain("'absence:create'");
    expect(publicFunction("cancel_absence")).toContain("'absence:cancel'");
    for (const name of ["create_absence", "cancel_absence"]) {
      const fn = publicFunction(name);
      expect(fn).toContain("security definer");
      expect(fn).toContain("set search_path = ''");
      expect(fn).toContain("private.require_organization_permission");
    }
  });

  it("implements the initial RBAC matrix", () => {
    for (const role of ["DIRECTOR", "OPERATIONS_MANAGER", "SUPERVISOR", "HR"]) {
      const branch = migration.match(
        new RegExp(`when '${role}' then array\\[([\\s\\S]*?)\\]::text\\[]`),
      )?.[1];
      expect(branch).toContain("'absence:read'");
      expect(branch).toContain("'absence:create'");
      expect(branch).toContain("'absence:cancel'");
    }
    for (const role of ["RECRUITER", "ADMINISTRATIVE"]) {
      const branch = migration.match(
        new RegExp(`when '${role}' then array\\[([\\s\\S]*?)\\]::text\\[]`),
      )?.[1];
      expect(branch).toContain("'absence:read'");
      expect(branch).not.toContain("'absence:create'");
      expect(branch).not.toContain("'absence:cancel'");
    }
  });

  it("keeps reads Organization-scoped and blocks direct DML", () => {
    expect(migration).toContain("alter table public.absences enable row level security");
    expect(migration).toContain(
      "has_organization_permission(organization_id, 'absence:read')",
    );
    expect(migration).toContain(
      "revoke all on table public.absences from anon, authenticated",
    );
    expect(migration).toContain("grant select on table public.absences to authenticated");
    expect(migration).not.toMatch(/grant (insert|update|delete).*absences.*authenticated/i);
  });

  it("cancels without deleting and writes both audit events atomically", () => {
    expect(migration).not.toMatch(/delete from public\.absences/i);
    expect(migration).toContain("set status = 'cancelled'");
    expect(migration).toContain("'absence',\n    new_absence.id,\n    'create'");
    expect(migration).toContain("'absence',\n    cancelled_absence.id,\n    'cancel'");
  });
});
