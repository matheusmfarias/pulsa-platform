create extension if not exists btree_gist with schema extensions;

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete restrict,
  position_id uuid not null references public.positions(id) on delete restrict,
  start_date date not null,
  end_date date,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_dates_valid check (
    end_date is null or end_date >= start_date
  ),
  constraint assignments_status_valid check (
    status in ('pending', 'active', 'suspended', 'finished', 'cancelled')
  ),
  constraint assignments_worker_active_period_exclusion exclude using gist (
    worker_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status in ('pending', 'active'))
);

create index assignments_worker_id_idx on public.assignments (worker_id);
create index assignments_position_id_idx on public.assignments (position_id);
create index assignments_status_idx on public.assignments (status);
create index assignments_position_dates_idx
  on public.assignments (position_id, start_date, end_date);

alter table public.assignments enable row level security;

create policy "Active members can read assignments"
on public.assignments for select to authenticated
using (
  exists (
    select 1
    from public.workers worker
    join public.positions position on position.id = assignments.position_id
    join public.units unit on unit.id = position.unit_id
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where worker.id = assignments.worker_id
      and worker.organization_id = client.organization_id
      and public.is_active_organization_member(worker.organization_id)
  )
);

create policy "Active members can create assignments"
on public.assignments for insert to authenticated
with check (
  exists (
    select 1
    from public.workers worker
    join public.positions position on position.id = assignments.position_id
    join public.units unit on unit.id = position.unit_id
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where worker.id = assignments.worker_id
      and worker.organization_id = client.organization_id
      and public.is_active_organization_member(worker.organization_id)
  )
);

create policy "Active members can update assignments"
on public.assignments for update to authenticated
using (
  exists (
    select 1
    from public.workers worker
    where worker.id = assignments.worker_id
      and public.is_active_organization_member(worker.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.workers worker
    join public.positions position on position.id = assignments.position_id
    join public.units unit on unit.id = position.unit_id
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where worker.id = assignments.worker_id
      and worker.organization_id = client.organization_id
      and public.is_active_organization_member(worker.organization_id)
  )
);

revoke all on public.assignments from anon, authenticated;
grant select on public.assignments to authenticated;

alter table public.audit_events drop constraint audit_events_entity_type_valid;
alter table public.audit_events add constraint audit_events_entity_type_valid check (
  entity_type in (
    'client', 'contract', 'operation', 'unit', 'position', 'worker',
    'organization_member', 'assignment'
  )
);

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
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.assignments;
  new_row public.assignments;
  organization_id uuid;
  target_organization_id uuid;
  target_position_organization_id uuid;
  target_worker_status text;
  target_position_status text;
  audit_action text;
  audit_metadata jsonb;
  tracked text[] := array[
    'worker_id', 'position_id', 'start_date', 'end_date', 'status'
  ];
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if operation in ('create', 'update') then
    select worker.organization_id, worker.status
      into target_organization_id, target_worker_status
    from public.workers worker
    where worker.id = mutate_assignment_with_audit.worker_id;

    select client.organization_id, position.status
      into target_position_organization_id, target_position_status
    from public.positions position
    join public.units unit on unit.id = position.unit_id
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    where position.id = mutate_assignment_with_audit.position_id;

    if target_organization_id is null then
      raise exception 'Worker not found' using errcode = '23503';
    end if;
    if target_position_organization_id is null then
      raise exception 'Position not found' using errcode = '23503';
    end if;
    if target_organization_id <> target_position_organization_id then
      raise exception 'Worker and Position must belong to the same organization'
        using errcode = '23514';
    end if;
  end if;

  if operation = 'create' then
    if not public.is_active_organization_member(target_organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    if target_worker_status <> 'active' then
      raise exception 'Worker must be active for a new Assignment' using errcode = '23514';
    end if;
    if target_position_status <> 'active' then
      raise exception 'Position must be active for a new Assignment' using errcode = '23514';
    end if;

    insert into public.assignments (
      worker_id, position_id, start_date, end_date, status
    ) values (
      mutate_assignment_with_audit.worker_id,
      mutate_assignment_with_audit.position_id,
      mutate_assignment_with_audit.start_date,
      mutate_assignment_with_audit.end_date,
      'pending'
    ) returning * into new_row;

    organization_id := target_organization_id;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select assignment_item.* into old_row
    from public.assignments assignment_item
    where assignment_item.id = mutate_assignment_with_audit.entity_id
    for update;
    if not found then
      raise exception 'Assignment not found' using errcode = 'P0002';
    end if;

    select worker.organization_id into organization_id
    from public.workers worker where worker.id = old_row.worker_id;
    if not public.is_active_organization_member(organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;

    if operation = 'update' then
      if target_organization_id <> organization_id then
        raise exception 'Cross-organization reassignment denied' using errcode = '42501';
      end if;
      if mutate_assignment_with_audit.worker_id <> old_row.worker_id
        and target_worker_status <> 'active' then
        raise exception 'New Worker must be active' using errcode = '23514';
      end if;
      if mutate_assignment_with_audit.position_id <> old_row.position_id
        and target_position_status <> 'active' then
        raise exception 'New Position must be active' using errcode = '23514';
      end if;

      update public.assignments set
        worker_id = mutate_assignment_with_audit.worker_id,
        position_id = mutate_assignment_with_audit.position_id,
        start_date = mutate_assignment_with_audit.start_date,
        end_date = mutate_assignment_with_audit.end_date,
        updated_at = now()
      where id = mutate_assignment_with_audit.entity_id
      returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      if not (
        (old_row.status = 'pending' and target_status in ('active', 'cancelled'))
        or (old_row.status = 'active' and target_status in ('suspended', 'finished'))
        or (old_row.status = 'suspended' and target_status in ('active', 'finished', 'cancelled'))
      ) then
        raise exception 'Invalid Assignment status transition' using errcode = '23514';
      end if;

      if target_status = 'active' then
        select worker.status into target_worker_status
        from public.workers worker where worker.id = old_row.worker_id;
        select position.status into target_position_status
        from public.positions position where position.id = old_row.position_id;
        if target_worker_status <> 'active' or target_position_status <> 'active' then
          raise exception 'Active Assignment requires active Worker and Position'
            using errcode = '23514';
        end if;
      end if;

      update public.assignments set
        status = mutate_assignment_with_audit.target_status,
        updated_at = now()
      where id = mutate_assignment_with_audit.entity_id
      returning * into new_row;
      audit_action := 'status_change';
    else
      raise exception 'Invalid audit mutation operation' using errcode = '22023';
    end if;

    audit_metadata := public.build_audit_metadata(
      to_jsonb(old_row), to_jsonb(new_row), tracked, array['status']::text[]
    );
  end if;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    organization_id, actor_id, 'assignment', new_row.id, audit_action, audit_metadata
  );

  return new_row;
end;
$$;

revoke all on function public.mutate_assignment_with_audit(text, uuid, uuid, uuid, date, date, text)
  from public;
grant execute on function public.mutate_assignment_with_audit(text, uuid, uuid, uuid, date, date, text)
  to authenticated;

comment on table public.assignments is
  'Temporal Worker-to-Position relationship. History is preserved through lifecycle statuses.';
comment on function public.mutate_assignment_with_audit(text, uuid, uuid, uuid, date, date, text) is
  'Atomically mutates one Assignment and appends its audit event.';
