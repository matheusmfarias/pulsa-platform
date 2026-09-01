create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null,
  created_at timestamptz not null default now(),
  constraint audit_events_entity_type_valid check (
    entity_type in (
      'client', 'contract', 'operation', 'unit', 'position', 'worker',
      'organization_member'
    )
  ),
  constraint audit_events_action_valid check (
    action in ('create', 'update', 'status_change', 'membership_change')
  ),
  constraint audit_events_metadata_valid check (
    jsonb_typeof(metadata) = 'object'
    and metadata ?& array['previous_state', 'new_state', 'changes']
    and jsonb_typeof(metadata -> 'previous_state') = 'object'
    and jsonb_typeof(metadata -> 'new_state') = 'object'
    and jsonb_typeof(metadata -> 'changes') = 'array'
  )
);

create index audit_events_organization_created_at_idx
  on public.audit_events (organization_id, created_at desc);
create index audit_events_entity_idx
  on public.audit_events (entity_type, entity_id, created_at desc);
create index audit_events_actor_user_id_idx
  on public.audit_events (actor_user_id, created_at desc);

alter table public.audit_events enable row level security;
revoke all on public.audit_events from anon, authenticated;

comment on table public.audit_events is
  'Append-only internal audit log. Business mutation and audit insertion occur in one RPC transaction.';

create function public.build_audit_metadata(
  previous_row jsonb,
  new_row jsonb,
  tracked_fields text[],
  visible_state_fields text[] default array['status']::text[]
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_variable
declare
  changed_fields text[];
  previous_state jsonb;
  new_state jsonb;
begin
  select coalesce(array_agg(field order by field), array[]::text[])
    into changed_fields
  from unnest(tracked_fields) as field
  where previous_row -> field is distinct from new_row -> field;

  select coalesce(jsonb_object_agg(field, previous_row -> field), '{}'::jsonb)
    into previous_state
  from unnest(visible_state_fields) as field
  where field = any(changed_fields);

  select coalesce(jsonb_object_agg(field, new_row -> field), '{}'::jsonb)
    into new_state
  from unnest(visible_state_fields) as field
  where field = any(changed_fields);

  return jsonb_build_object(
    'previous_state', previous_state,
    'new_state', new_state,
    'changes', to_jsonb(changed_fields)
  );
end;
$$;

create function public.mutate_contract_with_audit(
  operation text,
  entity_id uuid default null,
  client_id uuid default null,
  name text default null,
  start_date date default null,
  end_date date default null,
  external_reference text default null,
  target_status text default null
)
returns public.contracts
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.contracts;
  new_row public.contracts;
  organization_id uuid;
  target_organization_id uuid;
  audit_action text;
  audit_metadata jsonb;
  tracked text[] := array[
    'client_id', 'name', 'start_date', 'end_date', 'external_reference', 'status'
  ];
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;

  select client.organization_id into target_organization_id
  from public.clients client
  where client.id = mutate_contract_with_audit.client_id;
  if operation = 'create' then
    if target_organization_id is null then raise exception 'Client not found' using errcode = '23503'; end if;
    if not public.is_active_organization_member(target_organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    insert into public.contracts (
      client_id, name, start_date, end_date, external_reference, status
    ) values (client_id, name, start_date, end_date, external_reference, 'draft')
    returning * into new_row;
    organization_id := target_organization_id;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select contract.* into old_row
    from public.contracts contract where contract.id = entity_id for update;
    if not found then raise exception 'Contract not found' using errcode = 'P0002'; end if;
    select client.organization_id into organization_id
    from public.clients client where client.id = old_row.client_id;
    if not public.is_active_organization_member(organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    if operation = 'update' then
      if target_organization_id is null then raise exception 'Client not found' using errcode = '23503'; end if;
      if target_organization_id <> organization_id then
        raise exception 'Cross-organization reassignment denied' using errcode = '42501';
      end if;
      update public.contracts set
        client_id = mutate_contract_with_audit.client_id,
        name = mutate_contract_with_audit.name,
        start_date = mutate_contract_with_audit.start_date,
        end_date = mutate_contract_with_audit.end_date,
        external_reference = mutate_contract_with_audit.external_reference,
        updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      update public.contracts set status = target_status, updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'status_change';
    else
      raise exception 'Invalid audit mutation operation' using errcode = '22023';
    end if;
    audit_metadata := public.build_audit_metadata(
      to_jsonb(old_row), to_jsonb(new_row), tracked
    );
  end if;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (organization_id, actor_id, 'contract', new_row.id, audit_action, audit_metadata);
  return new_row;
end;
$$;

create function public.mutate_operation_with_audit(
  operation text,
  entity_id uuid default null,
  contract_id uuid default null,
  name text default null,
  description text default null,
  start_date date default null,
  end_date date default null,
  manager_user_id uuid default null,
  target_status text default null
)
returns public.operations
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.operations;
  new_row public.operations;
  organization_id uuid;
  target_organization_id uuid;
  audit_action text;
  audit_metadata jsonb;
  tracked text[] := array[
    'contract_id', 'name', 'description', 'start_date', 'end_date',
    'manager_user_id', 'status'
  ];
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;

  select client.organization_id into target_organization_id
  from public.contracts contract
  join public.clients client on client.id = contract.client_id
  where contract.id = contract_id;

  if operation = 'create' then
    if target_organization_id is null then raise exception 'Contract not found' using errcode = '23503'; end if;
    if not public.is_active_organization_member(target_organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    insert into public.operations (
      contract_id, name, description, start_date, end_date, manager_user_id, status
    ) values (
      contract_id, name, description, start_date, end_date, manager_user_id, 'planning'
    ) returning * into new_row;
    organization_id := target_organization_id;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select item.* into old_row from public.operations item
    where item.id = entity_id for update;
    if not found then raise exception 'Operation not found' using errcode = 'P0002'; end if;
    select client.organization_id into organization_id
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where contract.id = old_row.contract_id;
    if not public.is_active_organization_member(organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    if operation = 'update' then
      if target_organization_id is null then raise exception 'Contract not found' using errcode = '23503'; end if;
      if target_organization_id <> organization_id then
        raise exception 'Cross-organization reassignment denied' using errcode = '42501';
      end if;
      update public.operations set
        contract_id = mutate_operation_with_audit.contract_id,
        name = mutate_operation_with_audit.name,
        description = mutate_operation_with_audit.description,
        start_date = mutate_operation_with_audit.start_date,
        end_date = mutate_operation_with_audit.end_date,
        manager_user_id = mutate_operation_with_audit.manager_user_id,
        updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      update public.operations set status = target_status, updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'status_change';
    else
      raise exception 'Invalid audit mutation operation' using errcode = '22023';
    end if;
    audit_metadata := public.build_audit_metadata(
      to_jsonb(old_row), to_jsonb(new_row), tracked
    );
  end if;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (organization_id, actor_id, 'operation', new_row.id, audit_action, audit_metadata);
  return new_row;
end;
$$;

revoke all on function public.build_audit_metadata(jsonb, jsonb, text[], text[])
  from public, anon, authenticated;

create function public.mutate_client_with_audit(
  operation text,
  entity_id uuid default null,
  organization_id uuid default null,
  legal_name text default null,
  trade_name text default null,
  document_number text default null,
  target_status text default null
)
returns public.clients
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.clients;
  new_row public.clients;
  audit_action text;
  audit_metadata jsonb;
  tracked text[] := array['legal_name', 'trade_name', 'document_number', 'status'];
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;

  if operation = 'create' then
    if not public.is_active_organization_member(organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    insert into public.clients (organization_id, legal_name, trade_name, document_number, status)
    values (organization_id, legal_name, trade_name, document_number, 'active')
    returning * into new_row;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select * into old_row from public.clients where id = entity_id for update;
    if not found then raise exception 'Client not found' using errcode = 'P0002'; end if;
    if not public.is_active_organization_member(old_row.organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    if operation = 'update' then
      update public.clients set
        legal_name = mutate_client_with_audit.legal_name,
        trade_name = mutate_client_with_audit.trade_name,
        document_number = mutate_client_with_audit.document_number,
        updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      update public.clients set status = target_status, updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'status_change';
    else
      raise exception 'Invalid audit mutation operation' using errcode = '22023';
    end if;
    audit_metadata := public.build_audit_metadata(
      to_jsonb(old_row), to_jsonb(new_row), tracked
    );
  end if;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    new_row.organization_id, actor_id, 'client', new_row.id, audit_action, audit_metadata
  );
  return new_row;
end;
$$;

create function public.mutate_worker_with_audit(
  operation text,
  entity_id uuid default null,
  organization_id uuid default null,
  full_name text default null,
  document_number text default null,
  email text default null,
  phone text default null,
  engagement_start_date date default null,
  engagement_end_date date default null,
  target_status text default null
)
returns public.workers
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.workers;
  new_row public.workers;
  audit_action text;
  audit_metadata jsonb;
  tracked text[] := array[
    'full_name', 'document_number', 'email', 'phone',
    'engagement_start_date', 'engagement_end_date', 'status'
  ];
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;

  if operation = 'create' then
    if not public.is_active_organization_member(organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    insert into public.workers (
      organization_id, full_name, document_number, email, phone,
      engagement_start_date, engagement_end_date, status
    ) values (
      organization_id, full_name, document_number, email, phone,
      engagement_start_date, engagement_end_date, 'onboarding'
    ) returning * into new_row;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select * into old_row from public.workers where id = entity_id for update;
    if not found then raise exception 'Worker not found' using errcode = 'P0002'; end if;
    if not public.is_active_organization_member(old_row.organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    if operation = 'update' then
      update public.workers set
        full_name = mutate_worker_with_audit.full_name,
        document_number = mutate_worker_with_audit.document_number,
        email = mutate_worker_with_audit.email,
        phone = mutate_worker_with_audit.phone,
        engagement_start_date = mutate_worker_with_audit.engagement_start_date,
        engagement_end_date = mutate_worker_with_audit.engagement_end_date,
        updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      update public.workers set status = target_status, updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'status_change';
    else
      raise exception 'Invalid audit mutation operation' using errcode = '22023';
    end if;
    -- Only status values are ever copied into state objects. Worker PII is represented by field names only.
    audit_metadata := public.build_audit_metadata(
      to_jsonb(old_row), to_jsonb(new_row), tracked, array['status']::text[]
    );
  end if;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    new_row.organization_id, actor_id, 'worker', new_row.id, audit_action, audit_metadata
  );
  return new_row;
end;
$$;

create function public.mutate_unit_with_audit(
  operation text,
  entity_id uuid default null,
  operation_id uuid default null,
  name text default null,
  code text default null,
  address text default null,
  city text default null,
  state text default null,
  timezone text default null,
  target_status text default null
)
returns public.units
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.units;
  new_row public.units;
  organization_id uuid;
  target_organization_id uuid;
  audit_action text;
  audit_metadata jsonb;
  tracked text[] := array[
    'operation_id', 'name', 'code', 'address', 'city', 'state', 'timezone', 'status'
  ];
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;

  select client.organization_id into target_organization_id
  from public.operations item
  join public.contracts contract on contract.id = item.contract_id
  join public.clients client on client.id = contract.client_id
  where item.id = operation_id;

  if operation = 'create' then
    if target_organization_id is null then raise exception 'Operation not found' using errcode = '23503'; end if;
    if not public.is_active_organization_member(target_organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    insert into public.units (
      operation_id, name, code, address, city, state, timezone, status
    ) values (
      operation_id, name, code, address, city, state, timezone, 'active'
    ) returning * into new_row;
    organization_id := target_organization_id;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select item.* into old_row from public.units item
    where item.id = entity_id for update;
    if not found then raise exception 'Unit not found' using errcode = 'P0002'; end if;
    select client.organization_id into organization_id
    from public.operations item
    join public.contracts contract on contract.id = item.contract_id
    join public.clients client on client.id = contract.client_id
    where item.id = old_row.operation_id;
    if not public.is_active_organization_member(organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    if operation = 'update' then
      if target_organization_id is null then raise exception 'Operation not found' using errcode = '23503'; end if;
      if target_organization_id <> organization_id then
        raise exception 'Cross-organization reassignment denied' using errcode = '42501';
      end if;
      update public.units set
        operation_id = mutate_unit_with_audit.operation_id,
        name = mutate_unit_with_audit.name,
        code = mutate_unit_with_audit.code,
        address = mutate_unit_with_audit.address,
        city = mutate_unit_with_audit.city,
        state = mutate_unit_with_audit.state,
        timezone = mutate_unit_with_audit.timezone,
        updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      update public.units set status = target_status, updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'status_change';
    else
      raise exception 'Invalid audit mutation operation' using errcode = '22023';
    end if;
    audit_metadata := public.build_audit_metadata(
      to_jsonb(old_row), to_jsonb(new_row), tracked
    );
  end if;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (organization_id, actor_id, 'unit', new_row.id, audit_action, audit_metadata);
  return new_row;
end;
$$;

create function public.mutate_position_with_audit(
  operation text,
  entity_id uuid default null,
  unit_id uuid default null,
  title text default null,
  description text default null,
  base_required_headcount integer default null,
  target_status text default null
)
returns public.positions
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.positions;
  new_row public.positions;
  organization_id uuid;
  target_organization_id uuid;
  audit_action text;
  audit_metadata jsonb;
  tracked text[] := array[
    'unit_id', 'title', 'description', 'base_required_headcount', 'status'
  ];
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;

  select client.organization_id into target_organization_id
  from public.units unit
  join public.operations item on item.id = unit.operation_id
  join public.contracts contract on contract.id = item.contract_id
  join public.clients client on client.id = contract.client_id
  where unit.id = unit_id;

  if operation = 'create' then
    if target_organization_id is null then raise exception 'Unit not found' using errcode = '23503'; end if;
    if not public.is_active_organization_member(target_organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    insert into public.positions (
      unit_id, title, description, base_required_headcount, status
    ) values (unit_id, title, description, base_required_headcount, 'active')
    returning * into new_row;
    organization_id := target_organization_id;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select item.* into old_row from public.positions item
    where item.id = entity_id for update;
    if not found then raise exception 'Position not found' using errcode = 'P0002'; end if;
    select client.organization_id into organization_id
    from public.units unit
    join public.operations item on item.id = unit.operation_id
    join public.contracts contract on contract.id = item.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = old_row.unit_id;
    if not public.is_active_organization_member(organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    if operation = 'update' then
      if target_organization_id is null then raise exception 'Unit not found' using errcode = '23503'; end if;
      if target_organization_id <> organization_id then
        raise exception 'Cross-organization reassignment denied' using errcode = '42501';
      end if;
      update public.positions set
        unit_id = mutate_position_with_audit.unit_id,
        title = mutate_position_with_audit.title,
        description = mutate_position_with_audit.description,
        base_required_headcount = mutate_position_with_audit.base_required_headcount,
        updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      update public.positions set status = target_status, updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'status_change';
    else
      raise exception 'Invalid audit mutation operation' using errcode = '22023';
    end if;
    audit_metadata := public.build_audit_metadata(
      to_jsonb(old_row), to_jsonb(new_row), tracked
    );
  end if;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (organization_id, actor_id, 'position', new_row.id, audit_action, audit_metadata);
  return new_row;
end;
$$;

create function public.change_organization_membership_with_audit(
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
  actor_role text;
  old_row public.organization_members;
  new_row public.organization_members;
  audit_metadata jsonb;
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select membership.role into actor_role
  from public.organization_members membership
  where membership.organization_id = change_organization_membership_with_audit.organization_id
    and membership.profile_id = actor_id
    and membership.status = 'active';
  if actor_role is distinct from 'DIRECTOR' then
    raise exception 'Director membership required' using errcode = '42501';
  end if;

  select * into old_row from public.organization_members membership
  where membership.organization_id = change_organization_membership_with_audit.organization_id
    and membership.profile_id = target_profile_id
  for update;
  if not found then raise exception 'Membership not found' using errcode = 'P0002'; end if;

  update public.organization_members set
    role = target_role,
    status = target_status,
    updated_at = now()
  where public.organization_members.organization_id = change_organization_membership_with_audit.organization_id
    and profile_id = target_profile_id
  returning * into new_row;

  audit_metadata := public.build_audit_metadata(
    to_jsonb(old_row), to_jsonb(new_row), array['role', 'status']::text[],
    array['role', 'status']::text[]
  );
  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    new_row.organization_id, actor_id, 'organization_member', new_row.profile_id,
    'membership_change', audit_metadata
  );
  return new_row;
end;
$$;

revoke all on function public.mutate_client_with_audit(text, uuid, uuid, text, text, text, text) from public;
revoke all on function public.mutate_contract_with_audit(text, uuid, uuid, text, date, date, text, text) from public;
revoke all on function public.mutate_operation_with_audit(text, uuid, uuid, text, text, date, date, uuid, text) from public;
revoke all on function public.mutate_unit_with_audit(text, uuid, uuid, text, text, text, text, text, text, text) from public;
revoke all on function public.mutate_position_with_audit(text, uuid, uuid, text, text, integer, text) from public;
revoke all on function public.mutate_worker_with_audit(text, uuid, uuid, text, text, text, text, date, date, text) from public;
revoke all on function public.change_organization_membership_with_audit(uuid, uuid, text, text) from public;

grant execute on function public.mutate_client_with_audit(text, uuid, uuid, text, text, text, text) to authenticated;
grant execute on function public.mutate_contract_with_audit(text, uuid, uuid, text, date, date, text, text) to authenticated;
grant execute on function public.mutate_operation_with_audit(text, uuid, uuid, text, text, date, date, uuid, text) to authenticated;
grant execute on function public.mutate_unit_with_audit(text, uuid, uuid, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.mutate_position_with_audit(text, uuid, uuid, text, text, integer, text) to authenticated;
grant execute on function public.mutate_worker_with_audit(text, uuid, uuid, text, text, text, text, date, date, text) to authenticated;
grant execute on function public.change_organization_membership_with_audit(uuid, uuid, text, text) to authenticated;

-- Audited entities can only be mutated through the transaction-owning RPCs above.
revoke insert, update, delete on public.clients from authenticated;
revoke insert, update, delete on public.contracts from authenticated;
revoke insert, update, delete on public.operations from authenticated;
revoke insert, update, delete on public.units from authenticated;
revoke insert, update, delete on public.positions from authenticated;
revoke insert, update, delete on public.workers from authenticated;

comment on function public.change_organization_membership_with_audit(uuid, uuid, text, text) is
  'Director-only membership mutation. Role/status update and audit insertion are atomic.';
