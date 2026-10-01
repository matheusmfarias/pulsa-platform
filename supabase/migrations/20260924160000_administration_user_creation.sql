-- Directors can add a new Core identity to their Organization only through
-- this audited RPC. Auth provisioning happens server-side before this call.
create or replace function public.create_organization_member_with_audit(
  organization_id uuid,
  target_profile_id uuid,
  target_display_name text,
  target_role text
)
returns public.organization_members
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  new_row public.organization_members;
begin
  perform private.require_organization_permission(
    organization_id,
    'organization_member:update'
  );

  if nullif(btrim(target_display_name), '') is null
    or char_length(btrim(target_display_name)) > 120 then
    raise exception 'Invalid member display name' using errcode = '22023';
  end if;
  if target_role is null or target_role not in (
    'DIRECTOR', 'OPERATIONS_MANAGER', 'SUPERVISOR',
    'HR', 'RECRUITER', 'ADMINISTRATIVE'
  ) then
    raise exception 'Invalid organization role' using errcode = '22023';
  end if;

  -- Serialize membership changes in the same way as the existing role/status RPC.
  perform organization.id
  from public.organizations organization
  where organization.id = organization_id and organization.status = 'active'
  for update;
  if not found then
    raise exception 'Organization not found or inactive' using errcode = 'P0002';
  end if;

  -- Only identities provisioned by the server for Core can be enrolled. A
  -- Director cannot attach an arbitrary Worker/Auth identity by guessing its ID.
  perform auth_user.id
  from auth.users auth_user
  where auth_user.id = target_profile_id
    and auth_user.raw_app_meta_data ->> 'pulsa_surface' = 'core'
    and auth_user.raw_app_meta_data ->> 'pulsa_invite_organization_id' = organization_id::text;
  if not found then
    raise exception 'Core Auth identity not found' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.organization_members membership
    where membership.profile_id = target_profile_id
  ) then
    raise exception 'Identity already belongs to an Organization'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (id, display_name)
  values (target_profile_id, btrim(target_display_name));

  insert into public.organization_members (organization_id, profile_id, role, status)
  values (organization_id, target_profile_id, target_role, 'active')
  returning * into new_row;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    organization_id, actor_id, 'organization_member', target_profile_id, 'create',
    public.build_audit_metadata(
      '{}'::jsonb, to_jsonb(new_row),
      array['role', 'status']::text[], array['role', 'status']::text[]
    )
  );

  return new_row;
end;
$$;

revoke all on function public.create_organization_member_with_audit(
  uuid, uuid, text, text
) from public, anon;
grant execute on function public.create_organization_member_with_audit(
  uuid, uuid, text, text
) to authenticated;

comment on function public.create_organization_member_with_audit(
  uuid, uuid, text, text
) is 'Director-only Core membership creation, atomically audited and Organization-scoped.';
