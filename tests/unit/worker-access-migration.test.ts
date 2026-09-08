import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260908160000_worker_access_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("Worker Access migration", () => {
  it("models an explicit historical link without organization membership", () => {
    expect(migration).toContain("create table public.worker_access_invitations");
    expect(migration).toContain("create table public.worker_access_links");
    expect(migration).not.toMatch(/insert\s+into\s+public\.organization_members/i);
    expect(migration).not.toContain("document_number");
    expect(migration).toContain("target_auth_user_id");
  });

  it("enforces one current Worker and one current Auth profile", () => {
    expect(migration).toContain("worker_access_links_one_current_worker_idx");
    expect(migration).toContain("worker_access_links_one_current_profile_idx");
    expect(migration).toMatch(/where status in \('active', 'suspended'\)/);
    expect(migration).toContain("Revoked Worker access link is immutable");
  });

  it("keeps direct DML closed and exposes only narrow authenticated RPCs", () => {
    expect(migration).toContain(
      "alter table public.worker_access_links enable row level security",
    );
    expect(migration).toContain(
      "revoke all on table public.worker_access_links from anon, authenticated",
    );
    expect(migration).not.toMatch(
      /create policy[\s\S]+worker_access_(?:links|invitations)/i,
    );
    expect(migration).toContain(
      "grant execute on function public.resolve_worker_access() to authenticated",
    );
  });

  it("derives the Worker principal from auth.uid without browser identifiers", () => {
    expect(migration).toMatch(
      /create or replace function private\.require_worker_access\(\)/,
    );
    expect(migration).toContain("actor_id uuid := auth.uid()");
    expect(migration).toMatch(/create or replace function public\.claim_worker_access\(invitation_token text\)/);
    expect(migration).toMatch(/create or replace function public\.resolve_worker_access\(\)/);
    expect(migration).toContain("worker.status = 'active'");
    expect(migration).toContain("organization.status = 'active'");
  });

  it("revalidates Backoffice RBAC and audits each lifecycle mutation atomically", () => {
    expect(migration).toContain("'worker_access:read', 'worker_access:manage'");
    const hrPermissions = migration.match(
      /when 'HR' then array\[([\s\S]*?)\]::text\[\]/,
    )?.[1];
    expect(hrPermissions).toBeDefined();
    expect(hrPermissions).not.toContain("worker_access:");
    for (const action of ["invite", "claim", "suspend", "resume", "revoke"])
      expect(migration).toContain(`'${action}'`);
    expect(migration).toContain("'actor_worker_id', item.worker_id");
    expect(migration).toContain("'actor_surface', 'worker_app'");
  });
});
