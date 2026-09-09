-- Worker Auth Hardening: allow the authenticated provisioned user to claim its
-- only pending invitation without requiring the deep-link token. Token-based
-- claim remains supported and shares the same invariants and atomic mutation.

create or replace function private.claim_worker_access_core(
  required_token_hash text default null
)
returns public.worker_access_links
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  invitation public.worker_access_invitations;
  current_link public.worker_access_links;
  target_worker public.workers;
  item public.worker_access_links;
begin
  if actor_id is null then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  select access_link.* into current_link
  from public.worker_access_links access_link
  where access_link.profile_id = actor_id
    and access_link.status in ('active', 'suspended')
  for update;
  if found then
    if not exists (
      select 1
      from public.worker_access_invitations claimed_invitation
      where claimed_invitation.id = current_link.invitation_id
        and claimed_invitation.auth_user_id = actor_id
        and claimed_invitation.worker_id = current_link.worker_id
        and claimed_invitation.status = 'claimed'
        and (
          claim_worker_access_core.required_token_hash is null
          or claimed_invitation.invitation_token_hash =
            claim_worker_access_core.required_token_hash
        )
    ) then
      raise exception 'Worker access unavailable' using errcode = '42501';
    end if;
    if current_link.status = 'active' and exists (
      select 1
      from public.workers worker
      join public.organizations organization
        on organization.id = worker.organization_id
      where worker.id = current_link.worker_id
        and worker.status = 'active'
        and organization.status = 'active'
    ) then
      return current_link;
    end if;
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  select pending_invitation.* into invitation
  from public.worker_access_invitations pending_invitation
  where pending_invitation.auth_user_id = actor_id
    and pending_invitation.status = 'pending'
    and pending_invitation.expires_at > now()
    and (
      claim_worker_access_core.required_token_hash is null
      or pending_invitation.invitation_token_hash =
        claim_worker_access_core.required_token_hash
    )
  order by pending_invitation.created_at desc
  limit 1
  for update;
  if not found then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from auth.users auth_user
    where auth_user.id = actor_id
      and lower(auth_user.email) = invitation.invitation_email
      and auth_user.email_confirmed_at is not null
  ) then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  select worker.* into target_worker
  from public.workers worker
  join public.organizations organization
    on organization.id = worker.organization_id
  where worker.id = invitation.worker_id
    and worker.status = 'active'
    and organization.status = 'active'
  for update of worker;
  if not found then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.worker_access_links access_link
    where access_link.status in ('active', 'suspended')
      and (
        access_link.worker_id = invitation.worker_id
        or access_link.profile_id = actor_id
      )
  ) then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  insert into public.profiles (id, display_name)
  values (actor_id, null)
  on conflict (id) do nothing;

  insert into public.worker_access_links (
    invitation_id, worker_id, profile_id, activated_by
  ) values (
    invitation.id, invitation.worker_id, actor_id, actor_id
  ) returning * into item;

  update public.worker_access_invitations
  set status = 'claimed', claimed_at = now(), claimed_by = actor_id
  where id = invitation.id;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    target_worker.organization_id,
    actor_id,
    'worker_access_link',
    item.id,
    'claim',
    jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object(
        'worker_id', item.worker_id,
        'profile_id', item.profile_id,
        'status', item.status
      ),
      'changes', jsonb_build_array(
        'invitation_status', 'worker_id', 'profile_id', 'status'
      ),
      'invitation_id', invitation.id,
      'actor_worker_id', item.worker_id,
      'actor_surface', 'worker_app'
    )
  );

  return item;
end;
$$;

create or replace function public.get_my_pending_worker_access_claim()
returns table (
  worker_name text,
  invitation_email text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select worker.full_name, invitation.invitation_email, invitation.expires_at
  from public.worker_access_invitations invitation
  join public.workers worker on worker.id = invitation.worker_id
  join public.organizations organization
    on organization.id = worker.organization_id
  where invitation.auth_user_id = auth.uid()
    and invitation.status = 'pending'
    and invitation.expires_at > now()
    and worker.status = 'active'
    and organization.status = 'active'
  order by invitation.created_at desc
  limit 1;
$$;

create or replace function public.claim_worker_access(invitation_token text)
returns public.worker_access_links
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or claim_worker_access.invitation_token is null
    or claim_worker_access.invitation_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  return private.claim_worker_access_core(
    encode(
      extensions.digest(claim_worker_access.invitation_token, 'sha256'),
      'hex'
    )
  );
end;
$$;

create or replace function public.claim_my_worker_access()
returns public.worker_access_links
language sql
security definer
set search_path = ''
as $$
  select private.claim_worker_access_core(null);
$$;

revoke all on function private.claim_worker_access_core(text)
  from public, anon, authenticated;
revoke all on function public.get_my_pending_worker_access_claim()
  from public, anon;
revoke all on function public.claim_my_worker_access()
  from public, anon;

grant execute on function public.get_my_pending_worker_access_claim()
  to authenticated;
grant execute on function public.claim_my_worker_access()
  to authenticated;

comment on function private.claim_worker_access_core(text) is
  'Atomic Worker claim core shared by token and auth.uid-only entry points.';
comment on function public.get_my_pending_worker_access_claim() is
  'Returns only the active pending Worker invitation bound to auth.uid().';
comment on function public.claim_my_worker_access() is
  'Claims the active pending Worker invitation bound exclusively to auth.uid().';
