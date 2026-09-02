<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Pulsa Platform operational context

- `JobRole` is the reusable organizational cargo; `Position` is a concrete posto in a `Unit`.
  Never use `Position.title`; use `job_role_id` and display `JobRole.name`.
- `Worker` is not an auth user. `Assignment` is temporal, and occupancy counts only active
  Assignments. A Unit is an operational location, not a corporate department.
- Preserve Assignment history. Do not rewrite Position/Unit/Operation/Contract structural context
  after historical Assignments exist.
- Critical domain mutations must use RBAC-protected public RPCs and application services must use
  `requirePermission()`. Do not write protected domain tables with direct DML.
- Administration is initially DIRECTOR-only. Membership role/status changes must use the audited
  RPC, preserve the last active DIRECTOR, and audit reads must remain Organization-scoped by RLS.
- Do not add scheduling, shifts, coverage or vacancies without an explicit requirement.
- Real integration tests require explicit `SUPABASE_TEST_*` variables plus
  `SUPABASE_TEST_CONFIRMATION=integration-test`; never infer the linked Supabase project.
