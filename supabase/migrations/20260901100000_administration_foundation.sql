-- Phase 3 administration foundation. Administrative permissions remain a
-- fixed role-to-permission matrix and are granted only to DIRECTOR.

create or replace function public.has_organization_permission(
  target_organization_id uuid,
  required_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.profile_id = auth.uid()
      and membership.status = 'active'
      and required_permission = any (
        case membership.role
          when 'DIRECTOR' then array[
            'client:read', 'client:create', 'client:update',
            'contract:read', 'contract:create', 'contract:update',
            'operation:read', 'operation:create', 'operation:update',
            'unit:read', 'unit:create', 'unit:update',
            'job_role:read', 'job_role:create', 'job_role:update',
            'position:read', 'position:create', 'position:update',
            'worker:read', 'worker:create', 'worker:update',
            'assignment:read', 'assignment:create', 'assignment:update',
            'organization_member:read', 'organization_member:update',
            'audit:read'
          ]::text[]
          when 'OPERATIONS_MANAGER' then array[
            'client:read', 'client:create', 'client:update',
            'contract:read', 'contract:create', 'contract:update',
            'operation:read', 'operation:create', 'operation:update',
            'unit:read', 'unit:create', 'unit:update',
            'job_role:read', 'job_role:create', 'job_role:update',
            'position:read', 'position:create', 'position:update',
            'worker:read',
            'assignment:read', 'assignment:create', 'assignment:update'
          ]::text[]
          when 'SUPERVISOR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'unit:update', 'job_role:read',
            'position:read', 'position:update',
            'worker:read', 'assignment:read'
          ]::text[]
          when 'HR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'worker:update',
            'assignment:read', 'assignment:update'
          ]::text[]
          when 'RECRUITER' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'assignment:read'
          ]::text[]
          when 'ADMINISTRATIVE' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'assignment:read'
          ]::text[]
          else array[]::text[]
        end
      )
  );
$$;

revoke all on function public.has_organization_permission(uuid, text) from public;
grant execute on function public.has_organization_permission(uuid, text) to authenticated;

comment on function public.has_organization_permission(uuid, text) is
  'Checks the current active membership against the fixed RBAC matrix. Returns false by default.';

create or replace function private.require_organization_permission(
  target_organization_id uuid,
  required_permission text
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_organization_permission(
    target_organization_id,
    required_permission
  ) then
    raise exception 'Required organization permission missing'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.require_organization_permission(uuid, text)
  from public, anon, authenticated;

create or replace function public.change_organization_membership_with_audit(
  organization_id uuid,
  target_profile_id uuid,
  target_role text,
  target_status text
)
returns public.organization_members
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.organization_members;
  new_row public.organization_members;
  remaining_active_directors integer;
  audit_metadata jsonb;
begin
  perform private.require_organization_permission(
    organization_id,
    'organization_member:update'
  );

  -- Serialize administrative changes inside an Organization. This makes the
  -- last-DIRECTOR invariant safe even when two demotions run concurrently.
  perform organization.id
  from public.organizations organization
  where organization.id = organization_id
  for update;
  if not found then
    raise exception 'Organization not found' using errcode = 'P0002';
  end if;

  select membership.* into old_row
  from public.organization_members membership
  where membership.organization_id = organization_id
    and membership.profile_id = target_profile_id
  for update;
  if not found then
    raise exception 'Membership not found' using errcode = 'P0002';
  end if;

  if old_row.role = target_role and old_row.status = target_status then
    return old_row;
  end if;

  if old_row.role = 'DIRECTOR'
    and old_row.status = 'active'
    and (target_role <> 'DIRECTOR' or target_status <> 'active') then
    select count(*) into remaining_active_directors
    from public.organization_members membership
    where membership.organization_id = organization_id
      and membership.profile_id <> target_profile_id
      and membership.role = 'DIRECTOR'
      and membership.status = 'active';

    if remaining_active_directors = 0 then
      raise exception 'Organization must keep at least one active DIRECTOR'
        using errcode = 'P0001';
    end if;
  end if;

  update public.organization_members set
    role = target_role,
    status = target_status,
    updated_at = now()
  where public.organization_members.organization_id = organization_id
    and profile_id = target_profile_id
  returning * into new_row;

  audit_metadata := public.build_audit_metadata(
    to_jsonb(old_row),
    to_jsonb(new_row),
    array['role', 'status']::text[],
    array['role', 'status']::text[]
  );

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    metadata
  ) values (
    new_row.organization_id,
    actor_id,
    'organization_member',
    new_row.profile_id,
    'membership_change',
    audit_metadata
  );

  return new_row;
end;
$$;

revoke all on function public.change_organization_membership_with_audit(uuid, uuid, text, text)
  from public, anon;
grant execute on function public.change_organization_membership_with_audit(uuid, uuid, text, text)
  to authenticated;

revoke insert, update, delete on public.organization_members from authenticated;

create policy "Administrators can read member profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members target_membership
    where target_membership.profile_id = profiles.id
      and public.has_organization_permission(
        target_membership.organization_id,
        'organization_member:read'
      )
  )
);

create policy "Administrators can read organization audit events"
on public.audit_events
for select
to authenticated
using (
  public.has_organization_permission(organization_id, 'audit:read')
);

grant select on public.audit_events to authenticated;

create index audit_events_organization_entity_created_at_idx
  on public.audit_events (organization_id, entity_type, created_at desc);
create index audit_events_organization_action_created_at_idx
  on public.audit_events (organization_id, action, created_at desc);
create index audit_events_organization_actor_created_at_idx
  on public.audit_events (organization_id, actor_user_id, created_at desc);

comment on policy "Administrators can read organization audit events"
  on public.audit_events is
  'RLS-bound audit access for active memberships with audit:read; no service-role bypass is used by the UI.';
