-- One-time bootstrap for a clean production database. This is deliberately
-- unavailable to anon/authenticated users and creates the first audited
-- DIRECTOR membership only when the project has no Organization yet.
create or replace function public.bootstrap_initial_organization_director(
  target_organization_id uuid,
  target_legal_name text,
  target_trade_name text,
  target_profile_id uuid,
  target_display_name text
)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  organization_row public.organizations;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required for initial bootstrap'
      using errcode = '42501';
  end if;

  -- Serialize concurrent attempts. Only one initial Organization can be
  -- created, and the operation cannot be repeated after the first success.
  perform pg_advisory_xact_lock(hashtext('pulsa:initial-organization-bootstrap'));

  if exists (select 1 from public.organizations) then
    raise exception 'Initial bootstrap has already been completed'
      using errcode = '23505';
  end if;

  if target_organization_id is null
    or nullif(btrim(target_legal_name), '') is null
    or nullif(btrim(target_trade_name), '') is null
    or nullif(btrim(target_display_name), '') is null
    or char_length(btrim(target_display_name)) > 120 then
    raise exception 'Invalid initial Organization or Director details'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from auth.users auth_user
    where auth_user.id = target_profile_id
      and auth_user.raw_app_meta_data ->> 'pulsa_surface' = 'core'
      and auth_user.raw_app_meta_data ->> 'pulsa_invite_organization_id'
        = target_organization_id::text
  ) then
    raise exception 'Provisioned Core Auth identity not found'
      using errcode = 'P0002';
  end if;

  insert into public.organizations (id, legal_name, trade_name, status)
  values (
    target_organization_id,
    btrim(target_legal_name),
    btrim(target_trade_name),
    'active'
  )
  returning * into organization_row;

  insert into public.profiles (id, display_name)
  values (target_profile_id, btrim(target_display_name));

  insert into public.organization_members (
    organization_id, profile_id, role, status
  ) values (
    target_organization_id, target_profile_id, 'DIRECTOR', 'active'
  );

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    target_organization_id,
    target_profile_id,
    'organization_member',
    target_profile_id,
    'create',
    public.build_audit_metadata(
      '{}'::jsonb,
      jsonb_build_object('role', 'DIRECTOR', 'status', 'active'),
      array['role', 'status']::text[],
      array['role', 'status']::text[]
    )
  );

  return organization_row;
end;
$$;

revoke all on function public.bootstrap_initial_organization_director(
  uuid, text, text, uuid, text
) from public, anon, authenticated;
grant execute on function public.bootstrap_initial_organization_director(
  uuid, text, text, uuid, text
) to service_role;

comment on function public.bootstrap_initial_organization_director(
  uuid, text, text, uuid, text
) is 'One-time, service-role-only bootstrap for the first Organization and audited DIRECTOR membership on a clean project.';
