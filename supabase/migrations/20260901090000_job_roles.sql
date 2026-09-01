-- Separate the reusable organizational job catalog from concrete operational
-- Positions. Existing Position titles are backfilled deterministically before
-- the legacy column is removed.

create table public.job_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_roles_name_not_blank check (length(btrim(name)) > 0),
  constraint job_roles_name_length check (length(name) <= 160),
  constraint job_roles_description_length check (
    description is null or length(description) <= 2000
  ),
  constraint job_roles_status_valid check (status in ('active', 'inactive'))
);

create unique index job_roles_organization_normalized_name_uidx
  on public.job_roles (organization_id, lower(btrim(name)));
create index job_roles_organization_status_name_idx
  on public.job_roles (organization_id, status, name);

alter table public.job_roles enable row level security;

create policy "Members can read job roles in their organization"
on public.job_roles
for select
to authenticated
using (public.is_active_organization_member(organization_id));

revoke all on public.job_roles from anon, authenticated;
grant select on public.job_roles to authenticated;

alter table public.positions add column job_role_id uuid;

with source_titles as (
  select distinct on (
    client.organization_id,
    lower(btrim(position.title))
  )
    client.organization_id,
    btrim(position.title) as name
  from public.positions position
  join public.units unit on unit.id = position.unit_id
  join public.operations operation_item on operation_item.id = unit.operation_id
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  order by
    client.organization_id,
    lower(btrim(position.title)),
    position.created_at,
    position.id
)
insert into public.job_roles (organization_id, name)
select organization_id, name
from source_titles;

update public.positions position
set job_role_id = job_role.id
from public.units unit
join public.operations operation_item on operation_item.id = unit.operation_id
join public.contracts contract on contract.id = operation_item.contract_id
join public.clients client on client.id = contract.client_id
join public.job_roles job_role
  on job_role.organization_id = client.organization_id
where unit.id = position.unit_id
  and lower(btrim(job_role.name)) = lower(btrim(position.title));

alter table public.positions
  alter column job_role_id set not null,
  add constraint positions_job_role_id_fkey
    foreign key (job_role_id) references public.job_roles(id) on delete restrict;

create index positions_job_role_id_idx on public.positions(job_role_id);

-- The old audited Position functions reference title. Replace them before the
-- legacy source of truth is removed.
drop function public.mutate_position_with_audit(text, uuid, uuid, text, text, integer, text);
drop function private.mutate_position_with_audit(text, uuid, uuid, text, text, integer, text);

alter table public.positions
  drop constraint positions_title_not_blank,
  drop constraint positions_title_length,
  drop column title;

alter table public.audit_events drop constraint audit_events_entity_type_valid;
alter table public.audit_events add constraint audit_events_entity_type_valid check (
  entity_type in (
    'client', 'contract', 'operation', 'unit', 'position', 'worker',
    'organization_member', 'assignment', 'job_role'
  )
);

-- Keep the database permission matrix synchronized with permissions.ts.
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
            'job_role:read', 'job_role:create', 'job_role:update',
            'position:read', 'position:create', 'position:update',
            'worker:read', 'worker:create', 'worker:update',
            'assignment:read', 'assignment:create', 'assignment:update'
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
            'unit:read', 'unit:update',
            'job_role:read',
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
  ) into authorized;

  if not authorized then
    raise exception 'Required organization permission missing'
      using errcode = '42501';
  end if;
end;
$$;

create function private.mutate_job_role_with_audit(
  operation text,
  entity_id uuid default null,
  organization_id uuid default null,
  name text default null,
  description text default null,
  target_status text default null
)
returns public.job_roles
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.job_roles;
  new_row public.job_roles;
  audit_action text;
  audit_metadata jsonb;
  tracked text[] := array['name', 'description', 'status'];
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if operation = 'create' then
    insert into public.job_roles (
      organization_id, name, description, status
    ) values (
      organization_id, btrim(name), description, 'active'
    ) returning * into new_row;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select item.* into old_row
    from public.job_roles item
    where item.id = entity_id
    for update;
    if not found then
      raise exception 'Cargo não encontrado.' using errcode = 'P0002';
    end if;
    organization_id := old_row.organization_id;

    if operation = 'update' then
      update public.job_roles set
        name = btrim(mutate_job_role_with_audit.name),
        description = mutate_job_role_with_audit.description,
        updated_at = now()
      where id = entity_id
      returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      update public.job_roles set
        status = target_status,
        updated_at = now()
      where id = entity_id
      returning * into new_row;
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
    organization_id, actor_id, 'job_role', new_row.id, audit_action, audit_metadata
  );
  return new_row;
end;
$$;

create function public.mutate_job_role_with_audit(
  operation text,
  entity_id uuid default null,
  organization_id uuid default null,
  name text default null,
  description text default null,
  target_status text default null
)
returns public.job_roles
language plpgsql
security definer
set search_path = ''
as $$
declare
  permission text;
  resource_organization_id uuid;
begin
  permission := case operation
    when 'create' then 'job_role:create'
    when 'update' then 'job_role:update'
    when 'status_change' then 'job_role:update'
  end;
  if permission is null then
    raise exception 'Invalid audit mutation operation' using errcode = '22023';
  end if;

  if operation = 'create' then
    resource_organization_id := organization_id;
  else
    select job_role.organization_id into resource_organization_id
    from public.job_roles job_role
    where job_role.id = entity_id;
  end if;

  perform private.require_organization_permission(
    resource_organization_id, permission
  );
  return private.mutate_job_role_with_audit(
    operation, entity_id, resource_organization_id, name, description,
    target_status
  );
end;
$$;

create or replace function private.prevent_job_role_history_rewrite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.name is distinct from old.name
    and exists (
      select 1
      from public.positions position
      join public.assignments assignment_item
        on assignment_item.position_id = position.id
      where position.job_role_id = old.id
    ) then
    raise exception 'Não é possível renomear este Cargo porque ele já possui histórico de Assignments.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_position_unit_history_rewrite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.unit_id is distinct from old.unit_id
    and exists (
      select 1 from public.assignments assignment_item
      where assignment_item.position_id = old.id
    ) then
    raise exception 'Não é possível mover esta Position para outra Unit porque ela já possui histórico de Assignments.'
      using errcode = '23514';
  end if;

  if new.job_role_id is distinct from old.job_role_id
    and exists (
      select 1 from public.assignments assignment_item
      where assignment_item.position_id = old.id
    ) then
    raise exception 'Não é possível alterar o Cargo desta Position porque ela já possui histórico de Assignments.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_position_job_role_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  unit_organization_id uuid;
  job_role_organization_id uuid;
  job_role_status text;
begin
  select client.organization_id into unit_organization_id
  from public.units unit
  join public.operations operation_item on operation_item.id = unit.operation_id
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  where unit.id = new.unit_id;

  select job_role.organization_id, job_role.status
    into job_role_organization_id, job_role_status
  from public.job_roles job_role
  where job_role.id = new.job_role_id;

  if unit_organization_id is null then
    raise exception 'Unit não encontrada.' using errcode = '23503';
  end if;
  if job_role_organization_id is null then
    raise exception 'Cargo não encontrado.' using errcode = '23503';
  end if;
  if unit_organization_id <> job_role_organization_id then
    raise exception 'O Cargo e a Position precisam pertencer à mesma organização.'
      using errcode = '23514';
  end if;
  if job_role_status <> 'active'
    and (
      tg_op = 'INSERT'
      or new.job_role_id is distinct from old.job_role_id
    ) then
    raise exception 'A Position só pode ser vinculada a um Cargo ativo.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create function private.mutate_position_with_audit(
  operation text,
  entity_id uuid default null,
  unit_id uuid default null,
  job_role_id uuid default null,
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
    'unit_id', 'job_role_id', 'description', 'base_required_headcount', 'status'
  ];
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select client.organization_id into target_organization_id
  from public.units unit
  join public.operations operation_item on operation_item.id = unit.operation_id
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  where unit.id = unit_id;

  if operation = 'create' then
    if target_organization_id is null then
      raise exception 'Unit não encontrada.' using errcode = '23503';
    end if;
    insert into public.positions (
      unit_id, job_role_id, description, base_required_headcount, status
    ) values (
      unit_id, job_role_id, description, base_required_headcount, 'active'
    ) returning * into new_row;
    organization_id := target_organization_id;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select item.* into old_row
    from public.positions item
    where item.id = entity_id
    for update;
    if not found then
      raise exception 'Position não encontrada.' using errcode = 'P0002';
    end if;

    select client.organization_id into organization_id
    from public.units unit
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = old_row.unit_id;

    if operation = 'update' then
      if target_organization_id is null then
        raise exception 'Unit não encontrada.' using errcode = '23503';
      end if;
      if target_organization_id <> organization_id then
        raise exception 'Não é possível mover a Position para outra organização.'
          using errcode = '42501';
      end if;
      update public.positions set
        unit_id = mutate_position_with_audit.unit_id,
        job_role_id = mutate_position_with_audit.job_role_id,
        description = mutate_position_with_audit.description,
        base_required_headcount = mutate_position_with_audit.base_required_headcount,
        updated_at = now()
      where id = entity_id
      returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      update public.positions set
        status = target_status,
        updated_at = now()
      where id = entity_id
      returning * into new_row;
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
    organization_id, actor_id, 'position', new_row.id, audit_action, audit_metadata
  );
  return new_row;
end;
$$;

create function public.mutate_position_with_audit(
  operation text,
  entity_id uuid default null,
  unit_id uuid default null,
  job_role_id uuid default null,
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
  target_job_role_organization_id uuid;
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
  perform private.require_organization_permission(
    resource_organization_id, permission
  );

  if operation in ('create', 'update') then
    select client.organization_id into target_organization_id
    from public.units unit
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = unit_id;

    select job_role.organization_id into target_job_role_organization_id
    from public.job_roles job_role
    where job_role.id = job_role_id;

    perform private.require_organization_permission(
      target_organization_id, permission
    );
    if target_job_role_organization_id is null then
      raise exception 'Cargo não encontrado.' using errcode = '23503';
    end if;
    if target_job_role_organization_id <> target_organization_id then
      raise exception 'O Cargo e a Position precisam pertencer à mesma organização.'
        using errcode = '23514';
    end if;
  end if;

  return private.mutate_position_with_audit(
    operation, entity_id, unit_id, job_role_id, description,
    base_required_headcount, target_status
  );
end;
$$;

create trigger prevent_job_role_history_rewrite
before update on public.job_roles
for each row execute function private.prevent_job_role_history_rewrite();

create trigger enforce_position_job_role_organization
before insert or update on public.positions
for each row execute function private.enforce_position_job_role_organization();

revoke all on function private.require_organization_permission(uuid, text)
  from public, anon, authenticated;
revoke all on function private.mutate_job_role_with_audit(text, uuid, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function private.mutate_position_with_audit(text, uuid, uuid, uuid, text, integer, text)
  from public, anon, authenticated;
revoke all on function private.prevent_job_role_history_rewrite()
  from public, anon, authenticated;
revoke all on function private.prevent_position_unit_history_rewrite()
  from public, anon, authenticated;
revoke all on function private.enforce_position_job_role_organization()
  from public, anon, authenticated;

revoke all on function public.mutate_job_role_with_audit(text, uuid, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.mutate_position_with_audit(text, uuid, uuid, uuid, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.mutate_job_role_with_audit(text, uuid, uuid, text, text, text)
  to authenticated;
grant execute on function public.mutate_position_with_audit(text, uuid, uuid, uuid, text, integer, text)
  to authenticated;

revoke insert, update, delete on table public.job_roles from anon, authenticated;

comment on table public.job_roles is
  'Organization-level catalog of reusable cargos/funções. Positions remain concrete operational needs within Units.';
comment on column public.positions.job_role_id is
  'Required reusable cargo/function for this concrete operational Position.';
comment on function public.mutate_job_role_with_audit(text, uuid, uuid, text, text, text) is
  'RBAC-protected public wrapper for audited Cargo mutations.';
comment on function public.mutate_position_with_audit(text, uuid, uuid, uuid, text, integer, text) is
  'RBAC-protected public wrapper for audited Position mutations using job_role_id.';
