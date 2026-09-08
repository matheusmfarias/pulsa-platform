-- Phase 7A: Pulsa Worker identity and access foundation.
-- Worker is not an organization_member. The Worker principal is resolved from
-- auth.uid() through a dedicated, historical and revocable access link.

create table public.worker_access_invitations (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete restrict,
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  channel text not null default 'email',
  invitation_email text not null,
  invitation_token_hash text not null,
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  claimed_at timestamptz,
  claimed_by uuid references public.profiles(id) on delete restrict,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete restrict,
  revocation_reason text,
  expired_at timestamptz,
  constraint worker_access_invitations_email_valid check (
    invitation_email = lower(btrim(invitation_email))
    and char_length(invitation_email) between 3 and 254
  ),
  constraint worker_access_invitations_channel_valid check (channel = 'email'),
  constraint worker_access_invitations_token_hash_valid check (
    invitation_token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint worker_access_invitations_status_valid check (
    status in ('pending', 'claimed', 'revoked', 'expired')
  ),
  constraint worker_access_invitations_expiry_valid check (expires_at > created_at),
  constraint worker_access_invitations_lifecycle_valid check (
    (
      status = 'pending'
      and claimed_at is null and claimed_by is null
      and revoked_at is null and revoked_by is null and revocation_reason is null
      and expired_at is null
    ) or (
      status = 'claimed'
      and claimed_at is not null and claimed_by is not null
      and revoked_at is null and revoked_by is null and revocation_reason is null
      and expired_at is null
    ) or (
      status = 'revoked'
      and claimed_at is null and claimed_by is null
      and revoked_at is not null and revoked_by is not null
      and revocation_reason is not null
      and char_length(btrim(revocation_reason)) between 1 and 1000
      and expired_at is null
    ) or (
      status = 'expired'
      and claimed_at is null and claimed_by is null
      and revoked_at is null and revoked_by is null and revocation_reason is null
      and expired_at is not null
    )
  )
);

create unique index worker_access_invitations_one_pending_worker_idx
  on public.worker_access_invitations (worker_id)
  where status = 'pending';
create unique index worker_access_invitations_one_pending_auth_user_idx
  on public.worker_access_invitations (auth_user_id)
  where status = 'pending';
create index worker_access_invitations_worker_created_idx
  on public.worker_access_invitations (worker_id, created_at desc);
create index worker_access_invitations_auth_user_created_idx
  on public.worker_access_invitations (auth_user_id, created_at desc);

create table public.worker_access_links (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.worker_access_invitations(id) on delete restrict,
  worker_id uuid not null references public.workers(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'active',
  activated_at timestamptz not null default now(),
  activated_by uuid not null references public.profiles(id) on delete restrict,
  suspended_at timestamptz,
  suspended_by uuid references public.profiles(id) on delete restrict,
  suspension_reason text,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete restrict,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_access_links_status_valid check (
    status in ('active', 'suspended', 'revoked')
  ),
  constraint worker_access_links_lifecycle_valid check (
    (
      status = 'active'
      and suspended_at is null and suspended_by is null and suspension_reason is null
      and revoked_at is null and revoked_by is null and revocation_reason is null
    ) or (
      status = 'suspended'
      and suspended_at is not null and suspended_by is not null
      and suspension_reason is not null
      and char_length(btrim(suspension_reason)) between 1 and 1000
      and revoked_at is null and revoked_by is null and revocation_reason is null
    ) or (
      status = 'revoked'
      and revoked_at is not null and revoked_by is not null
      and revocation_reason is not null
      and char_length(btrim(revocation_reason)) between 1 and 1000
    )
  )
);

-- Suspended access remains current: suspension must not free either side of
-- the one-to-one relationship for a parallel link.
create unique index worker_access_links_one_current_worker_idx
  on public.worker_access_links (worker_id)
  where status in ('active', 'suspended');
create unique index worker_access_links_one_current_profile_idx
  on public.worker_access_links (profile_id)
  where status in ('active', 'suspended');
create index worker_access_links_worker_created_idx
  on public.worker_access_links (worker_id, created_at desc);
create index worker_access_links_profile_created_idx
  on public.worker_access_links (profile_id, created_at desc);

alter table public.worker_access_invitations enable row level security;
alter table public.worker_access_links enable row level security;

-- There are deliberately no direct policies. Both internal administrators and
-- Workers use narrow RPCs. In particular, a Worker cannot SELECT its link.
revoke all on table public.worker_access_invitations from anon, authenticated;
revoke all on table public.worker_access_links from anon, authenticated;

-- Keep the PostgreSQL permission matrix synchronized with permissions.ts.
-- Worker permissions are internal administration permissions, not permissions
-- granted to the Worker principal.
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
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel',
            'replacement:read', 'replacement:create', 'replacement:cancel',
            'presence:read', 'presence:create', 'presence:update', 'presence:cancel',
            'worker_access:read', 'worker_access:manage',
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
            'assignment:read', 'assignment:create', 'assignment:update',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel',
            'replacement:read', 'replacement:create', 'replacement:cancel',
            'presence:read', 'presence:create', 'presence:update', 'presence:cancel'
          ]::text[]
          when 'SUPERVISOR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'unit:update', 'job_role:read',
            'position:read', 'position:update',
            'worker:read', 'assignment:read',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel',
            'replacement:read', 'replacement:create', 'replacement:cancel',
            'presence:read', 'presence:create', 'presence:update', 'presence:cancel'
          ]::text[]
          when 'HR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'worker:update',
            'assignment:read', 'assignment:update',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel',
            'replacement:read', 'replacement:create', 'replacement:cancel',
            'presence:read'
          ]::text[]
          when 'RECRUITER' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'assignment:read',
            'schedule:read', 'absence:read', 'replacement:read'
          ]::text[]
          when 'ADMINISTRATIVE' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'assignment:read', 'schedule:read',
            'absence:read', 'replacement:read'
          ]::text[]
          else array[]::text[]
        end
      )
  );
$$;

revoke all on function public.has_organization_permission(uuid, text) from public;
grant execute on function public.has_organization_permission(uuid, text) to authenticated;

alter table public.audit_events drop constraint audit_events_entity_type_valid;
alter table public.audit_events add constraint audit_events_entity_type_valid check (
  entity_type in (
    'client', 'contract', 'operation', 'unit', 'position', 'worker',
    'organization_member', 'assignment', 'job_role', 'schedule',
    'schedule_revision', 'schedule_entry', 'absence', 'replacement', 'presence',
    'worker_access_invitation', 'worker_access_link'
  )
);

alter table public.audit_events drop constraint audit_events_action_valid;
alter table public.audit_events add constraint audit_events_action_valid check (
  action in (
    'create', 'update', 'delete', 'status_change', 'membership_change',
    'submit', 'approve', 'return_to_draft', 'publish',
    'create_from_published', 'cancel',
    'record_arrival', 'record_departure', 'correct',
    'invite', 'claim', 'suspend', 'resume', 'revoke', 'expire'
  )
);

create or replace function private.enforce_worker_access_invitation_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.worker_id <> old.worker_id
    or new.auth_user_id <> old.auth_user_id
    or new.channel <> old.channel
    or new.invitation_email <> old.invitation_email
    or new.invitation_token_hash <> old.invitation_token_hash
    or new.expires_at <> old.expires_at
    or new.created_at <> old.created_at
    or new.created_by <> old.created_by then
    raise exception 'Worker access invitation identity is immutable'
      using errcode = '23514';
  end if;
  if old.status <> 'pending' then
    raise exception 'Completed Worker access invitation is immutable'
      using errcode = '23514';
  end if;
  if new.status not in ('claimed', 'revoked', 'expired') then
    raise exception 'Invalid Worker access invitation transition'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger enforce_worker_access_invitation_history
before update on public.worker_access_invitations
for each row execute function private.enforce_worker_access_invitation_history();

create or replace function private.enforce_worker_access_link_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.invitation_id <> old.invitation_id
    or new.worker_id <> old.worker_id
    or new.profile_id <> old.profile_id
    or new.activated_at <> old.activated_at
    or new.activated_by <> old.activated_by
    or new.created_at <> old.created_at then
    raise exception 'Worker access link identity is immutable'
      using errcode = '23514';
  end if;
  if old.status = 'revoked' then
    raise exception 'Revoked Worker access link is immutable'
      using errcode = '23514';
  end if;
  if not (
    (old.status = 'active' and new.status in ('suspended', 'revoked'))
    or (old.status = 'suspended' and new.status in ('active', 'revoked'))
  ) then
    raise exception 'Invalid Worker access link transition'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger enforce_worker_access_link_history
before update on public.worker_access_links
for each row execute function private.enforce_worker_access_link_history();

create or replace function private.require_worker_access()
returns table (
  user_id uuid,
  worker_id uuid,
  organization_id uuid,
  worker_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  return query
  select actor_id, worker.id, worker.organization_id, worker.full_name
  from public.worker_access_links access_link
  join public.workers worker on worker.id = access_link.worker_id
  join public.organizations organization on organization.id = worker.organization_id
  where access_link.profile_id = actor_id
    and access_link.status = 'active'
    and worker.status = 'active'
    and organization.status = 'active';

  if not found then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.resolve_worker_access()
returns table (
  user_id uuid,
  worker_id uuid,
  organization_id uuid,
  worker_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from private.require_worker_access();
$$;

create or replace function public.get_worker_access_claim(invitation_token text)
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
  join public.organizations organization on organization.id = worker.organization_id
  where invitation.auth_user_id = auth.uid()
    and invitation.invitation_token_hash = encode(
      extensions.digest(get_worker_access_claim.invitation_token, 'sha256'),
      'hex'
    )
    and invitation.status = 'pending'
    and invitation.expires_at > now()
    and worker.status = 'active'
    and organization.status = 'active'
  limit 1;
$$;

create or replace function public.get_worker_access_administration(
  organization_id uuid,
  worker_id uuid
)
returns table (
  link_id uuid,
  link_status text,
  link_profile_id uuid,
  invitation_id uuid,
  invitation_status text,
  invitation_email text,
  invitation_expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_organization_permission(
    get_worker_access_administration.organization_id,
    'worker_access:read'
  );
  if not exists (
    select 1 from public.workers worker
    where worker.id = get_worker_access_administration.worker_id
      and worker.organization_id = get_worker_access_administration.organization_id
  ) then
    raise exception 'Worker access record not found' using errcode = 'P0002';
  end if;

  return query
  select current_link.id,
         current_link.status,
         current_link.profile_id,
         latest_invitation.id,
         case
           when latest_invitation.status = 'pending'
             and latest_invitation.expires_at <= now() then 'expired'
           else latest_invitation.status
         end,
         latest_invitation.invitation_email,
         latest_invitation.expires_at
  from (select 1) singleton
  left join lateral (
    select access_link.id, access_link.status, access_link.profile_id
    from public.worker_access_links access_link
    where access_link.worker_id = get_worker_access_administration.worker_id
      and access_link.status in ('active', 'suspended')
    limit 1
  ) current_link on true
  left join lateral (
    select invitation.id, invitation.status, invitation.invitation_email,
           invitation.expires_at
    from public.worker_access_invitations invitation
    where invitation.worker_id = get_worker_access_administration.worker_id
    order by invitation.created_at desc
    limit 1
  ) latest_invitation on true;
end;
$$;

create or replace function public.invite_worker_access(
  organization_id uuid,
  worker_id uuid,
  target_auth_user_id uuid,
  target_email text,
  invitation_token_hash text
)
returns public.worker_access_invitations
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  normalized_email text := lower(btrim(target_email));
  target_worker public.workers;
  invitation public.worker_access_invitations;
  expired_invitation public.worker_access_invitations;
begin
  perform private.require_organization_permission(
    invite_worker_access.organization_id,
    'worker_access:manage'
  );

  select worker.* into target_worker
  from public.workers worker
  where worker.id = invite_worker_access.worker_id
    and worker.organization_id = invite_worker_access.organization_id
  for update;
  if not found then
    raise exception 'Worker access record not found' using errcode = 'P0002';
  end if;
  if target_worker.status not in ('onboarding', 'active') then
    raise exception 'Worker is not eligible for access invitation' using errcode = '23514';
  end if;
  if normalized_email is null or char_length(normalized_email) not between 3 and 254 then
    raise exception 'Invalid Worker access invitation email' using errcode = '22023';
  end if;
  if invite_worker_access.invitation_token_hash is null
    or invite_worker_access.invitation_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid Worker access invitation token hash'
      using errcode = '22023';
  end if;
  if not exists (
    select 1 from auth.users auth_user
    where auth_user.id = invite_worker_access.target_auth_user_id
      and lower(auth_user.email) = normalized_email
  ) then
    raise exception 'Invited Auth User does not match the confirmed email'
      using errcode = '23514';
  end if;

  -- Expiration is made explicit before inserting a replacement invitation.
  for expired_invitation in
    select item.*
    from public.worker_access_invitations item
    where item.status = 'pending'
      and item.expires_at <= now()
      and (
        item.worker_id = invite_worker_access.worker_id
        or item.auth_user_id = invite_worker_access.target_auth_user_id
      )
    for update
  loop
    update public.worker_access_invitations
    set status = 'expired', expired_at = now()
    where id = expired_invitation.id;

    insert into public.audit_events (
      organization_id, actor_user_id, entity_type, entity_id, action, metadata
    ) values (
      target_worker.organization_id,
      actor_id,
      'worker_access_invitation',
      expired_invitation.id,
      'expire',
      jsonb_build_object(
        'previous_state', jsonb_build_object('status', 'pending'),
        'new_state', jsonb_build_object('status', 'expired'),
        'changes', jsonb_build_array('status', 'expired_at')
      )
    );
  end loop;

  if exists (
    select 1 from public.worker_access_links access_link
    where access_link.status in ('active', 'suspended')
      and (
        access_link.worker_id = invite_worker_access.worker_id
        or access_link.profile_id = invite_worker_access.target_auth_user_id
      )
  ) then
    raise exception 'Worker or Auth User already has current Worker access'
      using errcode = '23505';
  end if;

  insert into public.worker_access_invitations (
    worker_id, auth_user_id, invitation_email, invitation_token_hash, created_by
  ) values (
    invite_worker_access.worker_id,
    invite_worker_access.target_auth_user_id,
    normalized_email,
    invite_worker_access.invitation_token_hash,
    actor_id
  ) returning * into invitation;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    target_worker.organization_id,
    actor_id,
    'worker_access_invitation',
    invitation.id,
    'invite',
    jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object(
        'worker_id', invitation.worker_id,
        'auth_user_id', invitation.auth_user_id,
        'status', invitation.status,
        'expires_at', invitation.expires_at
      ),
      'changes', jsonb_build_array(
        'worker_id', 'auth_user_id', 'status', 'expires_at'
      ),
      'actor_surface', 'backoffice'
    )
  );
  return invitation;
end;
$$;

create or replace function public.claim_worker_access(invitation_token text)
returns public.worker_access_links
language plpgsql
security definer
set search_path = ''
as $$
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
  if claim_worker_access.invitation_token is null
    or claim_worker_access.invitation_token !~ '^[0-9a-f]{64}$' then
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
        and claimed_invitation.invitation_token_hash = encode(
          extensions.digest(claim_worker_access.invitation_token, 'sha256'),
          'hex'
        )
    ) then
      raise exception 'Worker access unavailable' using errcode = '42501';
    end if;
    if current_link.status = 'active' and exists (
      select 1
      from public.workers worker
      join public.organizations organization on organization.id = worker.organization_id
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
    and pending_invitation.invitation_token_hash = encode(
      extensions.digest(claim_worker_access.invitation_token, 'sha256'),
      'hex'
    )
    and pending_invitation.status = 'pending'
    and pending_invitation.expires_at > now()
  for update;
  if not found then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  if not exists (
    select 1 from auth.users auth_user
    where auth_user.id = actor_id
      and lower(auth_user.email) = invitation.invitation_email
      and auth_user.email_confirmed_at is not null
  ) then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  select worker.* into target_worker
  from public.workers worker
  join public.organizations organization on organization.id = worker.organization_id
  where worker.id = invitation.worker_id
    and worker.status = 'active'
    and organization.status = 'active'
  for update of worker;
  if not found then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.worker_access_links access_link
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

create or replace function public.suspend_worker_access(
  organization_id uuid,
  worker_id uuid,
  reason text
)
returns public.worker_access_links
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_item public.worker_access_links;
  item public.worker_access_links;
begin
  perform private.require_organization_permission(
    suspend_worker_access.organization_id,
    'worker_access:manage'
  );
  if nullif(btrim(reason), '') is null or char_length(btrim(reason)) > 1000 then
    raise exception 'Worker access suspension requires a valid reason'
      using errcode = '22023';
  end if;

  select access_link.* into old_item
  from public.worker_access_links access_link
  join public.workers worker on worker.id = access_link.worker_id
  where access_link.worker_id = suspend_worker_access.worker_id
    and worker.organization_id = suspend_worker_access.organization_id
    and access_link.status = 'active'
  for update of access_link;
  if not found then
    raise exception 'Worker access record not found' using errcode = 'P0002';
  end if;

  update public.worker_access_links
  set status = 'suspended',
      suspended_at = now(),
      suspended_by = actor_id,
      suspension_reason = btrim(reason),
      updated_at = now()
  where id = old_item.id
  returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    suspend_worker_access.organization_id,
    actor_id,
    'worker_access_link',
    item.id,
    'suspend',
    public.build_audit_metadata(
      to_jsonb(old_item), to_jsonb(item),
      array['status', 'suspended_at', 'suspended_by', 'suspension_reason', 'updated_at']::text[],
      array['status']::text[]
    ) || jsonb_build_object('reason', btrim(reason), 'actor_surface', 'backoffice')
  );
  return item;
end;
$$;

create or replace function public.resume_worker_access(
  organization_id uuid,
  worker_id uuid
)
returns public.worker_access_links
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_item public.worker_access_links;
  item public.worker_access_links;
begin
  perform private.require_organization_permission(
    resume_worker_access.organization_id,
    'worker_access:manage'
  );

  select access_link.* into old_item
  from public.worker_access_links access_link
  join public.workers worker on worker.id = access_link.worker_id
  join public.organizations organization on organization.id = worker.organization_id
  where access_link.worker_id = resume_worker_access.worker_id
    and worker.organization_id = resume_worker_access.organization_id
    and access_link.status = 'suspended'
    and worker.status = 'active'
    and organization.status = 'active'
  for update of access_link;
  if not found then
    raise exception 'Worker access record not found' using errcode = 'P0002';
  end if;

  update public.worker_access_links
  set status = 'active',
      suspended_at = null,
      suspended_by = null,
      suspension_reason = null,
      updated_at = now()
  where id = old_item.id
  returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    resume_worker_access.organization_id,
    actor_id,
    'worker_access_link',
    item.id,
    'resume',
    public.build_audit_metadata(
      to_jsonb(old_item), to_jsonb(item),
      array['status', 'suspended_at', 'suspended_by', 'suspension_reason', 'updated_at']::text[],
      array['status']::text[]
    ) || jsonb_build_object('actor_surface', 'backoffice')
  );
  return item;
end;
$$;

create or replace function public.revoke_worker_access(
  organization_id uuid,
  worker_id uuid,
  reason text
)
returns public.worker_access_links
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_item public.worker_access_links;
  item public.worker_access_links;
begin
  perform private.require_organization_permission(
    revoke_worker_access.organization_id,
    'worker_access:manage'
  );
  if nullif(btrim(reason), '') is null or char_length(btrim(reason)) > 1000 then
    raise exception 'Worker access revocation requires a valid reason'
      using errcode = '22023';
  end if;

  select access_link.* into old_item
  from public.worker_access_links access_link
  join public.workers worker on worker.id = access_link.worker_id
  where access_link.worker_id = revoke_worker_access.worker_id
    and worker.organization_id = revoke_worker_access.organization_id
    and access_link.status in ('active', 'suspended')
  for update of access_link;
  if not found then
    raise exception 'Worker access record not found' using errcode = 'P0002';
  end if;

  update public.worker_access_links
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = actor_id,
      revocation_reason = btrim(reason),
      updated_at = now()
  where id = old_item.id
  returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    revoke_worker_access.organization_id,
    actor_id,
    'worker_access_link',
    item.id,
    'revoke',
    public.build_audit_metadata(
      to_jsonb(old_item), to_jsonb(item),
      array['status', 'revoked_at', 'revoked_by', 'revocation_reason', 'updated_at']::text[],
      array['status']::text[]
    ) || jsonb_build_object('reason', btrim(reason), 'actor_surface', 'backoffice')
  );
  return item;
end;
$$;

create or replace function public.revoke_worker_access_invitation(
  organization_id uuid,
  invitation_id uuid,
  reason text
)
returns public.worker_access_invitations
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_item public.worker_access_invitations;
  item public.worker_access_invitations;
  resource_organization_id uuid;
begin
  perform private.require_organization_permission(
    revoke_worker_access_invitation.organization_id,
    'worker_access:manage'
  );

  select invitation.* into old_item
  from public.worker_access_invitations invitation
  join public.workers worker on worker.id = invitation.worker_id
  where invitation.id = revoke_worker_access_invitation.invitation_id
    and worker.organization_id = revoke_worker_access_invitation.organization_id
  for update of invitation;
  if not found then
    raise exception 'Worker access record not found' using errcode = 'P0002';
  end if;
  resource_organization_id := revoke_worker_access_invitation.organization_id;
  if old_item.status <> 'pending' then
    raise exception 'Only a pending Worker access invitation can be revoked'
      using errcode = '23514';
  end if;
  if nullif(btrim(reason), '') is null or char_length(btrim(reason)) > 1000 then
    raise exception 'Worker access revocation requires a valid reason'
      using errcode = '22023';
  end if;

  update public.worker_access_invitations
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = actor_id,
      revocation_reason = btrim(reason)
  where id = old_item.id
  returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    resource_organization_id,
    actor_id,
    'worker_access_invitation',
    item.id,
    'revoke',
    public.build_audit_metadata(
      to_jsonb(old_item), to_jsonb(item),
      array['status', 'revoked_at', 'revoked_by', 'revocation_reason']::text[],
      array['status']::text[]
    ) || jsonb_build_object('reason', btrim(reason), 'actor_surface', 'backoffice')
  );
  return item;
end;
$$;

-- A terminated Worker can never regain access through an old link. This runs
-- in the same transaction as the existing audited Worker status mutation.
create or replace function private.revoke_worker_access_on_termination()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  access_link public.worker_access_links;
  invitation public.worker_access_invitations;
begin
  if old.status = new.status or new.status <> 'terminated' then
    return new;
  end if;
  if actor_id is null then
    raise exception 'Authenticated actor required for Worker termination'
      using errcode = '42501';
  end if;

  for access_link in
    select item.* from public.worker_access_links item
    where item.worker_id = new.id and item.status in ('active', 'suspended')
    for update
  loop
    update public.worker_access_links
    set status = 'revoked',
        revoked_at = now(),
        revoked_by = actor_id,
        revocation_reason = 'worker_terminated',
        updated_at = now()
    where id = access_link.id;

    insert into public.audit_events (
      organization_id, actor_user_id, entity_type, entity_id, action, metadata
    ) values (
      new.organization_id,
      actor_id,
      'worker_access_link',
      access_link.id,
      'revoke',
      jsonb_build_object(
        'previous_state', jsonb_build_object('status', access_link.status),
        'new_state', jsonb_build_object('status', 'revoked'),
        'changes', jsonb_build_array(
          'status', 'revoked_at', 'revoked_by', 'revocation_reason', 'updated_at'
        ),
        'reason', 'worker_terminated',
        'actor_surface', 'backoffice'
      )
    );
  end loop;

  for invitation in
    select item.* from public.worker_access_invitations item
    where item.worker_id = new.id and item.status = 'pending'
    for update
  loop
    update public.worker_access_invitations
    set status = 'revoked',
        revoked_at = now(),
        revoked_by = actor_id,
        revocation_reason = 'worker_terminated'
    where id = invitation.id;

    insert into public.audit_events (
      organization_id, actor_user_id, entity_type, entity_id, action, metadata
    ) values (
      new.organization_id,
      actor_id,
      'worker_access_invitation',
      invitation.id,
      'revoke',
      jsonb_build_object(
        'previous_state', jsonb_build_object('status', 'pending'),
        'new_state', jsonb_build_object('status', 'revoked'),
        'changes', jsonb_build_array(
          'status', 'revoked_at', 'revoked_by', 'revocation_reason'
        ),
        'reason', 'worker_terminated',
        'actor_surface', 'backoffice'
      )
    );
  end loop;
  return new;
end;
$$;

create trigger revoke_worker_access_on_termination
before update of status on public.workers
for each row execute function private.revoke_worker_access_on_termination();

revoke all on function private.enforce_worker_access_invitation_history()
  from public, anon, authenticated;
revoke all on function private.enforce_worker_access_link_history()
  from public, anon, authenticated;
revoke all on function private.require_worker_access()
  from public, anon, authenticated;
revoke all on function private.revoke_worker_access_on_termination()
  from public, anon, authenticated;

revoke all on function public.resolve_worker_access() from public, anon;
revoke all on function public.get_worker_access_claim(text) from public, anon;
revoke all on function public.get_worker_access_administration(uuid, uuid)
  from public, anon;
revoke all on function public.invite_worker_access(uuid, uuid, uuid, text, text)
  from public, anon;
revoke all on function public.claim_worker_access(text) from public, anon;
revoke all on function public.suspend_worker_access(uuid, uuid, text)
  from public, anon;
revoke all on function public.resume_worker_access(uuid, uuid)
  from public, anon;
revoke all on function public.revoke_worker_access(uuid, uuid, text)
  from public, anon;
revoke all on function public.revoke_worker_access_invitation(uuid, uuid, text)
  from public, anon;

grant execute on function public.resolve_worker_access() to authenticated;
grant execute on function public.get_worker_access_claim(text) to authenticated;
grant execute on function public.get_worker_access_administration(uuid, uuid)
  to authenticated;
grant execute on function public.invite_worker_access(uuid, uuid, uuid, text, text)
  to authenticated;
grant execute on function public.claim_worker_access(text) to authenticated;
grant execute on function public.suspend_worker_access(uuid, uuid, text)
  to authenticated;
grant execute on function public.resume_worker_access(uuid, uuid)
  to authenticated;
grant execute on function public.revoke_worker_access(uuid, uuid, text)
  to authenticated;
grant execute on function public.revoke_worker_access_invitation(uuid, uuid, text)
  to authenticated;

comment on table public.worker_access_invitations is
  'Explicit Backoffice invitation of one Auth User to one Worker; it never creates a profile or organization membership before claim.';
comment on table public.worker_access_links is
  'Historical and revocable Auth profile to Worker link. Organization is derived from Worker.';
comment on function private.require_worker_access() is
  'Resolves the current Worker principal from auth.uid() and requires active link, Worker and Organization.';
comment on function public.claim_worker_access(text) is
  'Idempotently claims only the pending invitation bound to auth.uid(); accepts no Worker or Organization identifier.';
