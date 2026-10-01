create function public.get_operational_overview(
  target_organization_id uuid,
  target_context_type text,
  target_client_id uuid default null,
  target_contract_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if target_context_type not in ('all', 'client', 'contract')
    or (target_context_type = 'all' and (target_client_id is not null or target_contract_id is not null))
    or (target_context_type = 'client' and (target_client_id is null or target_contract_id is not null))
    or (target_context_type = 'contract' and (target_client_id is null or target_contract_id is null))
  then
    raise exception 'Invalid operational context' using errcode = '22023';
  end if;

  perform private.require_organization_permission(target_organization_id, 'operation:read');
  perform private.require_organization_permission(target_organization_id, 'unit:read');
  perform private.require_organization_permission(target_organization_id, 'worker:read');
  perform private.require_organization_permission(target_organization_id, 'position:read');
  perform private.require_organization_permission(target_organization_id, 'assignment:read');

  if target_context_type = 'client' and not exists (
    select 1
    from public.clients client
    where client.id = target_client_id
      and client.organization_id = target_organization_id
  ) then
    raise exception 'Operational context is outside the organization'
      using errcode = '42501';
  end if;

  if target_context_type = 'contract' and not exists (
    select 1
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where contract.id = target_contract_id
      and client.id = target_client_id
      and client.organization_id = target_organization_id
  ) then
    raise exception 'Operational context is outside the organization'
      using errcode = '42501';
  end if;

  with scoped_contracts as (
    select contract.id, contract.client_id, client.trade_name as client_name
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where client.organization_id = target_organization_id
      and (
        target_context_type = 'all'
        or client.id = target_client_id
      )
      and (
        target_context_type <> 'contract'
        or contract.id = target_contract_id
      )
  ), scoped_operations as (
    select operation.id, operation.contract_id, operation.name,
      operation.start_date, operation.status, scoped_contracts.client_name
    from public.operations operation
    join scoped_contracts on scoped_contracts.id = operation.contract_id
  ), active_operations as (
    select * from scoped_operations where status = 'active'
  ), active_units as (
    select unit.id, unit.operation_id
    from public.units unit
    join scoped_operations on scoped_operations.id = unit.operation_id
    where unit.status = 'active'
  ), active_positions as (
    select position.id, position.base_required_headcount,
      scoped_operations.id as operation_id
    from public.positions position
    join public.units unit on unit.id = position.unit_id
    join scoped_operations on scoped_operations.id = unit.operation_id
    where position.status = 'active'
  ), active_workers as (
    select worker.id
    from public.workers worker
    where worker.organization_id = target_organization_id
      and worker.status = 'active'
      and (
        target_context_type = 'all'
        or exists (
          select 1
          from public.assignments worker_assignment
          join public.positions worker_position
            on worker_position.id = worker_assignment.position_id
          join public.units worker_unit on worker_unit.id = worker_position.unit_id
          join scoped_operations worker_operation
            on worker_operation.id = worker_unit.operation_id
          where worker_assignment.worker_id = worker.id
        )
      )
  ), active_assignments as (
    select assignment.worker_id, assignment.position_id,
      scoped_operations.id as operation_id
    from public.assignments assignment
    join public.workers worker on worker.id = assignment.worker_id
    join public.positions position on position.id = assignment.position_id
    join public.units unit on unit.id = position.unit_id
    join scoped_operations on scoped_operations.id = unit.operation_id
    where assignment.status = 'active'
      and worker.organization_id = target_organization_id
  ), position_occupancy as (
    select assignment.position_id, count(*) as assigned_count
    from active_assignments assignment
    group by assignment.position_id
  ), operation_position_counts as (
    select position.operation_id, count(*) as position_count
    from active_positions position
    group by position.operation_id
  ), operation_unit_counts as (
    select unit.operation_id, count(*) as unit_count
    from active_units unit
    group by unit.operation_id
  ), operation_allocations as (
    select position.operation_id, count(distinct assignment.worker_id) as worker_count
    from active_positions position
    join active_assignments assignment on assignment.position_id = position.id
    group by position.operation_id
  ), operation_rows as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', operation.id,
          'name', operation.name,
          'clientName', operation.client_name,
          'units', coalesce(unit_counts.unit_count, 0),
          'positions', coalesce(position_counts.position_count, 0),
          'allocatedWorkers', coalesce(allocations.worker_count, 0)
        )
        order by operation.start_date desc, operation.name asc
      ),
      '[]'::jsonb
    ) as items
    from active_operations operation
    left join operation_unit_counts unit_counts on unit_counts.operation_id = operation.id
    left join operation_position_counts position_counts on position_counts.operation_id = operation.id
    left join operation_allocations allocations on allocations.operation_id = operation.id
  )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'activeOperations', (select count(*) from active_operations),
      'activeUnits', (select count(*) from active_units),
      'activeWorkers', (select count(*) from active_workers),
      'activeAssignments', (select count(*) from active_assignments),
      'activePositions', (select count(*) from active_positions),
      'totalRequiredHeadcount', coalesce(
        (select sum(position.base_required_headcount) from active_positions position),
        0
      )
    ),
    'attention', jsonb_build_object(
      'activeWorkersWithoutAssignment', (
        select count(*)
        from active_workers worker
        where not exists (
          select 1 from active_assignments assignment
          where assignment.worker_id = worker.id
        )
      ),
      'underfilledPositions', (
        select count(*)
        from active_positions position
        left join position_occupancy occupancy on occupancy.position_id = position.id
        where coalesce(occupancy.assigned_count, 0) < position.base_required_headcount
      )
    ),
    'operations', (select items from operation_rows)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_operational_overview(uuid, text, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.get_operational_overview(uuid, text, uuid, uuid)
  to authenticated;

comment on function public.get_operational_overview(uuid, text, uuid, uuid) is
  'Returns organization-scoped operational dashboard aggregates after checking every read permission used by the overview.';
