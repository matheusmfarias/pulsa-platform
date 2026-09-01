-- Database-side RBAC boundary for audited domain mutations.
--
-- The permission matrix below mirrors
-- src/modules/authorization/domain/permissions.ts. PostgreSQL must enforce the
-- same boundary because authenticated clients can call exposed RPCs directly.
-- Keep both matrices synchronized when roles or permissions change.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

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
declare
  actor_id uuid := auth.uid();
  authorized boolean;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.profile_id = actor_id
      and membership.status = 'active'
      and required_permission = any (
        case membership.role
          when 'DIRECTOR' then array[
            'client:read', 'client:create', 'client:update',
            'contract:read', 'contract:create', 'contract:update',
            'operation:read', 'operation:create', 'operation:update',
            'unit:read', 'unit:create', 'unit:update',
            'position:read', 'position:create', 'position:update',
            'worker:read', 'worker:create', 'worker:update',
            'assignment:read', 'assignment:create', 'assignment:update'
          ]::text[]
          when 'OPERATIONS_MANAGER' then array[
            'client:read', 'client:create', 'client:update',
            'contract:read', 'contract:create', 'contract:update',
            'operation:read', 'operation:create', 'operation:update',
            'unit:read', 'unit:create', 'unit:update',
            'position:read', 'position:create', 'position:update',
            'worker:read',
            'assignment:read', 'assignment:create', 'assignment:update'
          ]::text[]
          when 'SUPERVISOR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'unit:update',
            'position:read', 'position:update',
            'worker:read', 'assignment:read'
          ]::text[]
          when 'HR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'position:read',
            'worker:read', 'worker:create', 'worker:update',
            'assignment:read', 'assignment:update'
          ]::text[]
          when 'RECRUITER' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'position:read',
            'worker:read', 'worker:create', 'assignment:read'
          ]::text[]
          when 'ADMINISTRATIVE' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'position:read', 'worker:read', 'assignment:read'
          ]::text[]
          else array[]::text[]
        end
      )
  ) into authorized;

  if not authorized then
    raise exception 'Required organization permission missing'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.require_organization_permission(uuid, text)
  from public, anon, authenticated;

comment on function private.require_organization_permission(uuid, text) is
  'Checks auth.uid() against active organization membership and the RBAC matrix mirrored from permissions.ts; denies by default.';

-- Keep the existing audited mutation implementations private. Their names are
-- unchanged inside the private schema so PL/pgSQL parameter qualification in
-- the existing function bodies remains valid.
alter function public.mutate_client_with_audit(text, uuid, uuid, text, text, text, text)
  set schema private;
alter function public.mutate_contract_with_audit(text, uuid, uuid, text, date, date, text, text)
  set schema private;
alter function public.mutate_operation_with_audit(text, uuid, uuid, text, text, date, date, uuid, text)
  set schema private;
alter function public.mutate_unit_with_audit(text, uuid, uuid, text, text, text, text, text, text, text)
  set schema private;
alter function public.mutate_position_with_audit(text, uuid, uuid, text, text, integer, text)
  set schema private;
alter function public.mutate_worker_with_audit(text, uuid, uuid, text, text, text, text, date, date, text)
  set schema private;
alter function public.mutate_assignment_with_audit(text, uuid, uuid, uuid, date, date, text)
  set schema private;

revoke all on function private.mutate_client_with_audit(text, uuid, uuid, text, text, text, text)
  from public, anon, authenticated;
revoke all on function private.mutate_contract_with_audit(text, uuid, uuid, text, date, date, text, text)
  from public, anon, authenticated;
revoke all on function private.mutate_operation_with_audit(text, uuid, uuid, text, text, date, date, uuid, text)
  from public, anon, authenticated;
revoke all on function private.mutate_unit_with_audit(text, uuid, uuid, text, text, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function private.mutate_position_with_audit(text, uuid, uuid, text, text, integer, text)
  from public, anon, authenticated;
revoke all on function private.mutate_worker_with_audit(text, uuid, uuid, text, text, text, text, date, date, text)
  from public, anon, authenticated;
revoke all on function private.mutate_assignment_with_audit(text, uuid, uuid, uuid, date, date, text)
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
declare
  permission text;
  resource_organization_id uuid;
begin
  permission := case operation
    when 'create' then 'client:create'
    when 'update' then 'client:update'
    when 'status_change' then 'client:update'
  end;
  if permission is null then
    raise exception 'Invalid audit mutation operation' using errcode = '22023';
  end if;

  if operation = 'create' then
    resource_organization_id := organization_id;
  else
    select client.organization_id into resource_organization_id
    from public.clients client where client.id = entity_id;
  end if;

  perform private.require_organization_permission(resource_organization_id, permission);
  return private.mutate_client_with_audit(
    operation, entity_id, organization_id, legal_name, trade_name,
    document_number, target_status
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
declare
  permission text;
  resource_organization_id uuid;
  target_organization_id uuid;
begin
  permission := case operation
    when 'create' then 'contract:create'
    when 'update' then 'contract:update'
    when 'status_change' then 'contract:update'
  end;
  if permission is null then
    raise exception 'Invalid audit mutation operation' using errcode = '22023';
  end if;

  if operation = 'create' then
    select client.organization_id into resource_organization_id
    from public.clients client where client.id = client_id;
  else
    select client.organization_id into resource_organization_id
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where contract.id = entity_id;
  end if;
  perform private.require_organization_permission(resource_organization_id, permission);

  if operation = 'update' then
    select client.organization_id into target_organization_id
    from public.clients client where client.id = client_id;
    perform private.require_organization_permission(target_organization_id, permission);
  end if;

  return private.mutate_contract_with_audit(
    operation, entity_id, client_id, name, start_date, end_date,
    external_reference, target_status
  );
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
declare
  permission text;
  resource_organization_id uuid;
  target_organization_id uuid;
begin
  permission := case operation
    when 'create' then 'operation:create'
    when 'update' then 'operation:update'
    when 'status_change' then 'operation:update'
  end;
  if permission is null then
    raise exception 'Invalid audit mutation operation' using errcode = '22023';
  end if;

  if operation = 'create' then
    select client.organization_id into resource_organization_id
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where contract.id = contract_id;
  else
    select client.organization_id into resource_organization_id
    from public.operations operation_item
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where operation_item.id = entity_id;
  end if;
  perform private.require_organization_permission(resource_organization_id, permission);

  if operation = 'update' then
    select client.organization_id into target_organization_id
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where contract.id = contract_id;
    perform private.require_organization_permission(target_organization_id, permission);
  else
    target_organization_id := resource_organization_id;
  end if;

  if operation in ('create', 'update') and manager_user_id is not null and not exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.profile_id = manager_user_id
      and membership.status = 'active'
  ) then
    raise exception 'Operation manager must have an active organization membership'
      using errcode = '23514';
  end if;

  return private.mutate_operation_with_audit(
    operation, entity_id, contract_id, name, description, start_date, end_date,
    manager_user_id, target_status
  );
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
declare
  permission text;
  resource_organization_id uuid;
  target_organization_id uuid;
begin
  permission := case operation
    when 'create' then 'unit:create'
    when 'update' then 'unit:update'
    when 'status_change' then 'unit:update'
  end;
  if permission is null then
    raise exception 'Invalid audit mutation operation' using errcode = '22023';
  end if;

  if operation = 'create' then
    select client.organization_id into resource_organization_id
    from public.operations operation_item
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where operation_item.id = operation_id;
  else
    select client.organization_id into resource_organization_id
    from public.units unit
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = entity_id;
  end if;
  perform private.require_organization_permission(resource_organization_id, permission);

  if operation = 'update' then
    select client.organization_id into target_organization_id
    from public.operations operation_item
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where operation_item.id = operation_id;
    perform private.require_organization_permission(target_organization_id, permission);
  end if;

  return private.mutate_unit_with_audit(
    operation, entity_id, operation_id, name, code, address, city, state,
    timezone, target_status
  );
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
declare
  permission text;
  resource_organization_id uuid;
  target_organization_id uuid;
begin
  permission := case operation
    when 'create' then 'position:create'
    when 'update' then 'position:update'
    when 'status_change' then 'position:update'
  end;
  if permission is null then
    raise exception 'Invalid audit mutation operation' using errcode = '22023';
  end if;

  if operation = 'create' then
    select client.organization_id into resource_organization_id
    from public.units unit
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = unit_id;
  else
    select client.organization_id into resource_organization_id
    from public.positions position
    join public.units unit on unit.id = position.unit_id
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where position.id = entity_id;
  end if;
  perform private.require_organization_permission(resource_organization_id, permission);

  if operation = 'update' then
    select client.organization_id into target_organization_id
    from public.units unit
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = unit_id;
    perform private.require_organization_permission(target_organization_id, permission);
  end if;

  return private.mutate_position_with_audit(
    operation, entity_id, unit_id, title, description,
    base_required_headcount, target_status
  );
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
declare
  permission text;
  resource_organization_id uuid;
begin
  permission := case operation
    when 'create' then 'worker:create'
    when 'update' then 'worker:update'
    when 'status_change' then 'worker:update'
  end;
  if permission is null then
    raise exception 'Invalid audit mutation operation' using errcode = '22023';
  end if;

  if operation = 'create' then
    resource_organization_id := organization_id;
  else
    select worker.organization_id into resource_organization_id
    from public.workers worker where worker.id = entity_id;
  end if;

  perform private.require_organization_permission(resource_organization_id, permission);
  return private.mutate_worker_with_audit(
    operation, entity_id, organization_id, full_name, document_number, email,
    phone, engagement_start_date, engagement_end_date, target_status
  );
end;
$$;

create function public.mutate_assignment_with_audit(
  operation text,
  entity_id uuid default null,
  worker_id uuid default null,
  position_id uuid default null,
  start_date date default null,
  end_date date default null,
  target_status text default null
)
returns public.assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  permission text;
  resource_organization_id uuid;
  target_worker_organization_id uuid;
  target_position_organization_id uuid;
begin
  permission := case operation
    when 'create' then 'assignment:create'
    when 'update' then 'assignment:update'
    when 'status_change' then 'assignment:update'
  end;
  if permission is null then
    raise exception 'Invalid audit mutation operation' using errcode = '22023';
  end if;

  if operation = 'create' then
    select worker.organization_id into resource_organization_id
    from public.workers worker where worker.id = worker_id;
  else
    select worker.organization_id into resource_organization_id
    from public.assignments assignment
    join public.workers worker on worker.id = assignment.worker_id
    where assignment.id = entity_id;
  end if;
  perform private.require_organization_permission(resource_organization_id, permission);

  if operation in ('create', 'update') then
    select worker.organization_id into target_worker_organization_id
    from public.workers worker where worker.id = worker_id;
    select client.organization_id into target_position_organization_id
    from public.positions position
    join public.units unit on unit.id = position.unit_id
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where position.id = position_id;
    perform private.require_organization_permission(target_worker_organization_id, permission);
    perform private.require_organization_permission(target_position_organization_id, permission);
  end if;

  return private.mutate_assignment_with_audit(
    operation, entity_id, worker_id, position_id, start_date, end_date,
    target_status
  );
end;
$$;

revoke all on function public.mutate_client_with_audit(text, uuid, uuid, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.mutate_contract_with_audit(text, uuid, uuid, text, date, date, text, text)
  from public, anon, authenticated;
revoke all on function public.mutate_operation_with_audit(text, uuid, uuid, text, text, date, date, uuid, text)
  from public, anon, authenticated;
revoke all on function public.mutate_unit_with_audit(text, uuid, uuid, text, text, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.mutate_position_with_audit(text, uuid, uuid, text, text, integer, text)
  from public, anon, authenticated;
revoke all on function public.mutate_worker_with_audit(text, uuid, uuid, text, text, text, text, date, date, text)
  from public, anon, authenticated;
revoke all on function public.mutate_assignment_with_audit(text, uuid, uuid, uuid, date, date, text)
  from public, anon, authenticated;

grant execute on function public.mutate_client_with_audit(text, uuid, uuid, text, text, text, text)
  to authenticated;
grant execute on function public.mutate_contract_with_audit(text, uuid, uuid, text, date, date, text, text)
  to authenticated;
grant execute on function public.mutate_operation_with_audit(text, uuid, uuid, text, text, date, date, uuid, text)
  to authenticated;
grant execute on function public.mutate_unit_with_audit(text, uuid, uuid, text, text, text, text, text, text, text)
  to authenticated;
grant execute on function public.mutate_position_with_audit(text, uuid, uuid, text, text, integer, text)
  to authenticated;
grant execute on function public.mutate_worker_with_audit(text, uuid, uuid, text, text, text, text, date, date, text)
  to authenticated;
grant execute on function public.mutate_assignment_with_audit(text, uuid, uuid, uuid, date, date, text)
  to authenticated;

-- Domain writes must pass through the wrappers above so authorization and
-- audit stay in the same request path. SELECT grants and read RLS are preserved.
revoke insert, update, delete on table
  public.clients,
  public.contracts,
  public.operations,
  public.units,
  public.positions,
  public.workers,
  public.assignments
from anon, authenticated;

drop policy if exists "Members can create clients in their organization" on public.clients;
drop policy if exists "Members can update clients in their organization" on public.clients;
drop policy if exists "Members can create contracts in their organization" on public.contracts;
drop policy if exists "Members can update contracts in their organization" on public.contracts;
drop policy if exists "Members can create operations in their organization" on public.operations;
drop policy if exists "Members can update operations in their organization" on public.operations;
drop policy if exists "Members can create units in their organization" on public.units;
drop policy if exists "Members can update units in their organization" on public.units;
drop policy if exists "Members can create positions in their organization" on public.positions;
drop policy if exists "Members can update positions in their organization" on public.positions;
drop policy if exists "Active members can create workers" on public.workers;
drop policy if exists "Active members can update workers" on public.workers;
drop policy if exists "Active members can create assignments" on public.assignments;
drop policy if exists "Active members can update assignments" on public.assignments;

comment on function public.mutate_client_with_audit(text, uuid, uuid, text, text, text, text) is
  'RBAC-protected public wrapper for audited Client mutations.';
comment on function public.mutate_contract_with_audit(text, uuid, uuid, text, date, date, text, text) is
  'RBAC-protected public wrapper for audited Contract mutations.';
comment on function public.mutate_operation_with_audit(text, uuid, uuid, text, text, date, date, uuid, text) is
  'RBAC-protected public wrapper for audited Operation mutations.';
comment on function public.mutate_unit_with_audit(text, uuid, uuid, text, text, text, text, text, text, text) is
  'RBAC-protected public wrapper for audited Unit mutations.';
comment on function public.mutate_position_with_audit(text, uuid, uuid, text, text, integer, text) is
  'RBAC-protected public wrapper for audited Position mutations.';
comment on function public.mutate_worker_with_audit(text, uuid, uuid, text, text, text, text, date, date, text) is
  'RBAC-protected public wrapper for audited Worker mutations.';
comment on function public.mutate_assignment_with_audit(text, uuid, uuid, uuid, date, date, text) is
  'RBAC-protected public wrapper for audited Assignment mutations.';
