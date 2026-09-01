alter table public.organization_members
  add column role text;

-- Preserve the administrative access of memberships that predate RBAC.
update public.organization_members
set role = 'DIRECTOR'
where role is null;

alter table public.organization_members
  alter column role set default 'ADMINISTRATIVE',
  alter column role set not null,
  add constraint organization_members_role_valid check (
    role in (
      'DIRECTOR',
      'OPERATIONS_MANAGER',
      'SUPERVISOR',
      'HR',
      'RECRUITER',
      'ADMINISTRATIVE'
    )
  );

comment on column public.organization_members.role is
  'Single internal RBAC role. Permissions remain defined in application code.';
