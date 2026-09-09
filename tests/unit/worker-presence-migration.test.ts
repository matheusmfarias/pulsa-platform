import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260908190000_worker_presence.sql",
    import.meta.url,
  ),
  "utf8",
);

function publicFunction(name: string) {
  const match = migration.match(
    new RegExp(
      `create or replace function public\\.${name}\\(([\\s\\S]*?)\\n\\)\\nreturns`,
    ),
  );
  expect(match, `${name} must exist`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("Worker Presence migration", () => {
  it("keeps Worker RPC inputs narrow and derives identity, source and time", () => {
    const start = publicFunction("worker_start_presence");
    const complete = publicFunction("worker_complete_presence");
    expect(start).toContain("schedule_entry_id uuid");
    expect(start).toContain("source_reference text");
    expect(start).toContain("idempotency_key text");
    expect(complete).toContain("schedule_entry_id uuid");
    expect(complete).toContain("idempotency_key text");
    for (const forbidden of [
      "organization_id",
      "worker_id",
      "assignment_id",
      "replacement_id",
      "source text",
      "arrived_at",
      "departed_at",
    ]) {
      expect(`${start}\n${complete}`).not.toContain(forbidden);
    }
    expect(migration).toContain("clock_timestamp()");
    expect(migration).toContain("'app', source_reference_uuid::text");
  });

  it("routes Backoffice and Worker through shared Presence cores", () => {
    expect(migration).toContain("function private.start_presence_core(");
    expect(migration).toContain("function private.complete_presence_core(");
    expect(migration).toMatch(
      /function private\.start_presence\([\s\S]*select private\.start_presence_core\(/,
    );
    expect(migration).toMatch(
      /function private\.worker_start_presence\([\s\S]*return private\.start_presence_core\(/,
    );
    expect(migration).toMatch(
      /function private\.complete_presence\([\s\S]*select private\.complete_presence_core\(/,
    );
    expect(migration).toMatch(
      /function private\.worker_complete_presence\([\s\S]*return private\.complete_presence_core\(/,
    );
    expect(migration).toContain("private.replay_presence_command(");
    expect(migration).toContain("private.finish_presence_command(");
  });

  it("uses stable Worker idempotency payloads without database timestamps", () => {
    const workerStartPayload = migration.match(
      /if target_actor_worker_id is not null then\s+if[\s\S]*?payload := jsonb_build_object\(([\s\S]*?)\);/,
    )?.[1];
    const workerCompletePayload = migration.match(
      /create or replace function private\.complete_presence_core[\s\S]*?if target_actor_worker_id is not null then[\s\S]*?payload := jsonb_build_object\(([\s\S]*?)\);/,
    )?.[1];
    expect(workerStartPayload).toContain("'schedule_entry_id'");
    expect(workerStartPayload).toContain("'source_reference'");
    expect(workerStartPayload).not.toContain("target_arrived_at");
    expect(workerCompletePayload).toContain("'schedule_entry_id'");
    expect(workerCompletePayload).not.toContain("target_departed_at");
    expect(migration).toContain(
      "command_source_reference := coalesce(old_item.source_reference, old_item.id::text)",
    );
  });

  it("locks and resolves original, uncovered and replacement contexts atomically", () => {
    expect(migration).toContain("for update of entry, schedule_item");
    expect(migration).toContain("and absence.status = 'reported'");
    expect(migration).toContain("and replacement.status = 'active'");
    expect(migration).toContain(
      "resolved_assignment_id := entry_context.original_assignment_id",
    );
    expect(migration).toContain(
      "resolved_assignment_id := active_replacement.replacement_assignment_id",
    );
    expect(migration).toContain("Presence cannot start for an uncovered Absence");
    expect(migration).toContain(
      "assignment_context.worker_id <> target_actor_worker_id",
    );
    expect(migration).toContain(
      "assignment_context.assignment_status not in ('pending', 'active')",
    );
  });

  it("enforces the Unit civil-day or active-interval arrival rule", () => {
    expect(migration).toContain(
      "target_arrived_at at time zone entry_context.timezone",
    );
    expect(migration).toContain("= planned_start_date");
    expect(migration).toContain(
      "entry_context.starts_at <= target_arrived_at",
    );
    expect(migration).toContain(
      "target_arrived_at < entry_context.ends_at",
    );
    expect(migration).toContain("planned_start_date < assignment_context.start_date");
    expect(migration).toContain("planned_end_date > assignment_context.end_date");
  });

  it("completes only the authenticated Worker's open Presence without rechecking publication", () => {
    const completion = migration.match(
      /create or replace function private\.complete_presence_core([\s\S]*?)create or replace function private\.complete_presence\(/,
    )?.[1] ?? "";
    expect(completion).toContain("actual_assignment.worker_id = target_actor_worker_id");
    expect(completion).toContain("presence.status = 'present'");
    expect(completion).not.toContain("schedule_revisions");
    expect(completion).not.toContain("assignment_status");
    expect(completion).toContain("target_departed_at <= old_item.arrived_at");
  });

  it("returns minimized action and history projections", () => {
    expect(migration).toContain("function public.get_worker_presence_action(");
    expect(migration).toContain("if own_presence_status = 'present' then return 'complete'");
    expect(migration).toContain("revision.status = 'published'");
    expect(migration).toContain("function public.list_worker_presence_history(");
    expect(migration).toContain("presence.status in ('present', 'completed')");
    expect(migration).toContain("actual_assignment.worker_id = context.worker_id");
    expect(migration).toContain("case when presence.replacement_id is null");
    const historySignature = migration.match(
      /function public\.list_worker_presence_history\([\s\S]*?returns table \(([\s\S]*?)\)\nlanguage/,
    )?.[1] ?? "";
    expect(historySignature).not.toMatch(
      /(?:worker_id|assignment_id|replacement_id)/,
    );
  });

  it("writes atomic Worker audit metadata and blocks unsafe execution", () => {
    expect(migration).toContain("'actor_worker_id', target_actor_worker_id");
    expect(migration).toContain("'actor_surface', target_actor_surface");
    expect(migration).toContain("'command_source', target_source");
    expect(migration).toContain("'command_source_reference', target_source_reference");
    expect(migration).toContain(
      "revoke all on function private.start_presence_core(",
    );
    expect(migration).toContain(
      "revoke all on function public.worker_start_presence(uuid, text, text)",
    );
    expect(migration).toContain("from public, anon");
    expect(migration).toContain("to authenticated");
    expect(migration).not.toMatch(/grant (?:insert|update|delete).*presences/i);
  });
});
