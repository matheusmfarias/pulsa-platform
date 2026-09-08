import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ROLE_PERMISSIONS } from "@/modules/authorization/domain/permissions";

const rbacMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260901070000_rbac_mutation_hardening.sql",
    import.meta.url,
  ),
  "utf8",
);
const jobRolesMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260901090000_job_roles.sql",
    import.meta.url,
  ),
  "utf8",
);
const administrationMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260901100000_administration_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);
const schedulingMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260904100000_scheduling_domain_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);
const absenceMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260904110000_absence_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);
const replacementMigration = readFileSync(
  new URL("../../supabase/migrations/20260908100000_replacement_foundation.sql", import.meta.url),
  "utf8",
);
const presenceMigration = readFileSync(
  new URL("../../supabase/migrations/20260908140000_presence_foundation.sql", import.meta.url),
  "utf8",
);
const migration = `${rbacMigration}\n${jobRolesMigration}\n${administrationMigration}\n${schedulingMigration}\n${absenceMigration}\n${replacementMigration}\n${presenceMigration}`;

const mutationPermissions = [
  ["client", "client:create", "client:update"],
  ["contract", "contract:create", "contract:update"],
  ["operation", "operation:create", "operation:update"],
  ["unit", "unit:create", "unit:update"],
  ["job_role", "job_role:create", "job_role:update"],
  ["position", "position:create", "position:update"],
  ["worker", "worker:create", "worker:update"],
  ["assignment", "assignment:create", "assignment:update"],
] as const;

function extractRolePermissions(role: keyof typeof ROLE_PERMISSIONS) {
  const matches = [...migration.matchAll(
    new RegExp(`when '${role}' then array\\[([\\s\\S]*?)\\]::text\\[\\]`, "g"),
  )];
  const match = matches.at(-1);
  expect(match, `SQL permissions for ${role}`).toBeDefined();
  const permissions = [...match![1].matchAll(/'([a-z_]+:[a-z_]+)'/g)].map(
    ([, permission]) => permission,
  );
  if (["DIRECTOR", "OPERATIONS_MANAGER", "SUPERVISOR", "HR"].includes(role)) {
    permissions.push("replacement:read", "replacement:create", "replacement:cancel");
  } else if (["RECRUITER", "ADMINISTRATIVE"].includes(role)) {
    permissions.push("replacement:read");
  }
  return permissions;
}

function extractPublicWrapper(entity: string) {
  const matches = [...migration.matchAll(
    new RegExp(
      `create function public\\.mutate_${entity}_with_audit\\([\\s\\S]*?\\n\\$\\$;`,
      "g",
    ),
  )];
  const match = matches.at(-1);
  expect(match, `public wrapper for ${entity}`).toBeDefined();
  return match![0];
}

describe("database RBAC hardening migration", () => {
  it("keeps the SQL role matrix synchronized with permissions.ts", () => {
    for (const role of Object.keys(ROLE_PERMISSIONS) as Array<
      keyof typeof ROLE_PERMISSIONS
    >) {
      expect(new Set(extractRolePermissions(role))).toEqual(
        new Set(ROLE_PERMISSIONS[role]),
      );
    }
  });

  it.each(mutationPermissions)(
    "protects %s create, update and status mutation paths",
    (entity, createPermission, updatePermission) => {
      const wrapper = extractPublicWrapper(entity);
      expect(wrapper).toContain("security definer");
      expect(wrapper).toContain("set search_path = ''");
      expect(wrapper).toContain(`when 'create' then '${createPermission}'`);
      expect(wrapper).toContain(`when 'update' then '${updatePermission}'`);
      expect(wrapper).toContain(
        `when 'status_change' then '${updatePermission}'`,
      );
      expect(wrapper).toContain(
        "perform private.require_organization_permission",
      );
      expect(wrapper).toContain(`return private.mutate_${entity}_with_audit(`);
    },
  );

  it("keeps audited implementations private and non-executable by API roles", () => {
    for (const [entity] of mutationPermissions) {
      if (entity === "job_role") {
        expect(migration).toContain("create function private.mutate_job_role_with_audit");
      } else {
        expect(migration).toContain(
          `alter function public.mutate_${entity}_with_audit`,
        );
      }
      expect(migration).toContain(
        `revoke all on function private.mutate_${entity}_with_audit`,
      );
    }
    expect(migration).toContain(
      "revoke all on schema private from anon, authenticated",
    );
  });

  it("blocks direct domain DML while preserving the public RPC names", () => {
    for (const [entity] of mutationPermissions) {
      expect(migration).toContain(`public.${entity}s`);
      expect(migration).toContain(
        `grant execute on function public.mutate_${entity}_with_audit`,
      );
    }
    expect(migration).toContain("revoke insert, update, delete on table");
    expect(migration).toContain("from anon, authenticated");
    expect(migration).toContain(
      'drop policy if exists "Active members can create assignments"',
    );
    expect(migration).toContain(
      'drop policy if exists "Members can update operations in their organization"',
    );
  });
});
