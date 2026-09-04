import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260904100000_scheduling_domain_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);

function publicFunction(name: string) {
  const match = migration.match(
    new RegExp(
      `create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`,
    ),
  );
  expect(match, `public function ${name}`).not.toBeNull();
  return match![0];
}

describe("Scheduling domain foundation migration", () => {
  it("creates only the three Scheduling foundation entities", () => {
    expect(migration).toContain("create table public.schedules (");
    expect(migration).toContain("create table public.schedule_revisions (");
    expect(migration).toContain("create table public.schedule_entries (");
    expect(migration).not.toMatch(
      /create table public\.(attendance|staffing_requirements|acknowledgements|recurrences)/,
    );
  });

  it("protects Schedule period ordering and overlap per Operation", () => {
    expect(migration).toContain("schedules_period_valid");
    expect(migration).toContain("period_start <= period_end");
    expect(migration).toContain("schedules_operation_period_exclusion exclude using gist");
    expect(migration).toContain("daterange(period_start, period_end, '[]') with &&");
  });

  it("keeps revision versions unique and based_on inside the same Schedule", () => {
    expect(migration).toContain(
      "schedule_revisions_schedule_version_unique unique (schedule_id, version)",
    );
    expect(migration).toContain(
      "foreign key (schedule_id, based_on_revision_id)",
    );
    expect(migration).toContain(
      "references public.schedule_revisions(schedule_id, id)",
    );
    expect(migration).not.toContain("current_revision_id");
  });

  it("enforces entry and break intervals structurally", () => {
    expect(migration).toContain("starts_at < ends_at");
    expect(migration).toContain(
      "(break_starts_at is null and break_ends_at is null)",
    );
    expect(migration).toContain("starts_at < break_starts_at");
    expect(migration).toContain("break_starts_at < break_ends_at");
    expect(migration).toContain("break_ends_at < ends_at");
  });

  it("allows entry mutation only while its revision is draft", () => {
    expect(migration).toContain("enforce_schedule_entry_editability");
    expect(migration).toContain("if target_status <> 'draft' then");
    expect(migration).toContain(
      "ScheduleEntry can only be changed in a draft revision",
    );
    expect(migration).toContain(
      "then old.schedule_revision_id else new.schedule_revision_id end\n  for update;",
    );
  });

  it("enforces allowed lifecycle transitions and published immutability", () => {
    expect(migration).toContain("old.status = 'draft' and new.status = 'pending_approval'");
    expect(migration).toContain(
      "old.status = 'pending_approval' and new.status in ('approved', 'draft')",
    );
    expect(migration).toContain(
      "old.status = 'approved' and new.status in ('published', 'draft')",
    );
    expect(migration).toContain("Published ScheduleRevision is immutable");
    expect(migration).toContain("Invalid ScheduleRevision status transition");
  });

  it("exposes explicit protected lifecycle RPCs instead of a generic status RPC", () => {
    const permissions = {
      submit_schedule_revision: "schedule:submit",
      approve_schedule_revision: "schedule:approve",
      return_schedule_revision_to_draft: "schedule:update",
      publish_schedule_revision: "schedule:publish",
      create_schedule_revision_from_published: "schedule:create",
    } as const;

    for (const [name, permission] of Object.entries(permissions)) {
      const fn = publicFunction(name);
      expect(fn).toContain("security definer");
      expect(fn).toContain("set search_path = ''");
      expect(fn).toContain("private.require_organization_permission");
      expect(fn).toContain(`'${permission}'`);
    }
    expect(migration).not.toContain("update_schedule_revision_status");
  });

  it("validates Assignment organization, Operation, status and temporal eligibility", () => {
    expect(migration).toContain(
      "Assignment and Schedule must belong to the same Organization",
    );
    expect(migration).toContain(
      "Assignment and Schedule must belong to the same Operation",
    );
    expect(migration).toContain("assignment_status not in ('pending', 'active')");
    expect(migration).toContain("ScheduleEntry is outside the Assignment validity");
    expect(migration).toContain("ScheduleEntry is outside the Schedule civil period");
    expect(migration).toContain("at time zone unit_timezone");
    expect(migration).toContain("ScheduleEntry is outside the Operation validity");
    expect(migration).toContain("ScheduleEntry is outside the Contract validity");
  });

  it("revalidates current data at submit, approve and publish", () => {
    const transition = migration.match(
      /create or replace function private\.transition_schedule_revision\([\s\S]*?\n\$\$;/,
    )?.[0];
    expect(transition).toBeDefined();
    expect(transition?.match(/private\.validate_schedule_revision/g)).toHaveLength(3);
    expect(transition).toContain("target_status = 'pending_approval'");
    expect(transition).toContain("target_status = 'approved'");
    expect(transition).toContain("target_status = 'published'");
  });

  it("detects Worker overlap inside the revision and across relevant Schedules", () => {
    expect(migration).toContain("second_assignment.worker_id = first_assignment.worker_id");
    expect(migration).toContain("external_assignment.worker_id = candidate_assignment.worker_id");
    expect(migration).toContain("external_schedule.organization_id = target_organization_id");
    expect(migration).toContain("external_schedule.id <> target_schedule_id");
    expect(migration).toContain("external_revision.status in ('pending_approval', 'approved')");
    expect(migration).toContain("external_revision.status = 'published'");
    expect(migration).toContain("select max(current_revision.version)");
    expect(migration).toContain("current_revision.status = 'published'");
    expect(migration).not.toContain("external_revision.status = 'draft'");
  });

  it("serializes transitions and revision version allocation", () => {
    expect(migration).toContain("from public.organizations organization");
    expect(migration).toContain("where organization.id = organization_id\n  for update;");
    expect(migration).toContain("from public.schedules schedule_item");
    expect(migration).toContain("where schedule_item.id = source_revision.schedule_id\n  for update;");
    expect(migration).toContain("coalesce(max(revision.version), 0) + 1");
  });

  it("returns submitted or approved revisions to a clean draft", () => {
    expect(migration).toContain(
      "old_revision.status not in ('pending_approval', 'approved')",
    );
    expect(migration).toContain("submitted_at = null");
    expect(migration).toContain("submitted_by = null");
    expect(migration).toContain("approved_at = null");
    expect(migration).toContain("approved_by = null");
  });

  it("copies a published revision with the next version and one aggregate audit", () => {
    expect(migration).toContain("select revision.* into source_revision");
    expect(migration).toContain(
      "select schedule_item.organization_id into organization_id",
    );
    expect(migration).not.toContain(
      "into source_revision, organization_id",
    );
    expect(migration).toContain("source_revision.status <> 'published'");
    expect(migration).toContain("based_on_revision_id, created_by");
    expect(migration).toContain("from public.schedule_entries entry");
    expect(migration).toContain("get diagnostics copied_entries = row_count");
    expect(migration).toContain("'create_from_published'");
    expect(migration).toContain("'copied_entries', copied_entries");
  });

  it("audits Scheduling mutations in the same database functions", () => {
    for (const entityType of ["schedule", "schedule_revision", "schedule_entry"]) {
      expect(migration).toContain(`'${entityType}'`);
    }
    for (const action of [
      "'create'",
      "'update'",
      "'delete'",
      "'submit'",
      "'approve'",
      "'return_to_draft'",
      "'publish'",
      "'create_from_published'",
    ]) {
      expect(migration).toContain(action);
    }
  });

  it("blocks direct DML and keeps reads Organization-scoped through RLS", () => {
    for (const table of ["schedules", "schedule_revisions", "schedule_entries"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(
        `revoke all on table public.${table} from anon, authenticated`,
      );
      expect(migration).toContain(
        `grant select on table public.${table} to authenticated`,
      );
    }
    expect(migration).toContain(
      "has_organization_permission(organization_id, 'schedule:read')",
    );
    expect(migration).toContain("schedule_item.organization_id");
  });

  it("adds only indexes used by period, revision and conflict lookups", () => {
    expect(migration).toContain("schedules_operation_period_idx");
    expect(migration).toContain("schedule_revisions_current_published_idx");
    expect(migration).toContain("schedule_entries_revision_id_idx");
    expect(migration).toContain("schedule_entries_assignment_id_idx");
    expect(migration).toContain("schedule_entries_assignment_interval_idx");
    expect(migration).toContain("schedule_entries_interval_gist_idx");
  });
});
