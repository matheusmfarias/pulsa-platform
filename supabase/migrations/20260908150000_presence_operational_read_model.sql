-- Phase 6B: authoritative daily expected-versus-actual operational projection.
-- Derived states and timing signals are read-only and are never persisted.

create or replace function public.list_presence_operational_day(
  target_organization_id uuid,
  target_date date,
  target_client_id uuid default null,
  target_contract_id uuid default null
)
returns table (
  schedule_entry_id uuid,
  schedule_id uuid,
  schedule_revision_id uuid,
  planned_assignment_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  client_id uuid,
  client_name text,
  contract_id uuid,
  contract_name text,
  operation_id uuid,
  operation_name text,
  unit_id uuid,
  unit_name text,
  unit_timezone text,
  position_id uuid,
  job_role_id uuid,
  job_role_name text,
  original_worker_id uuid,
  original_worker_name text,
  absence_id uuid,
  absence_reason text,
  replacement_id uuid,
  replacement_assignment_id uuid,
  replacement_worker_id uuid,
  replacement_worker_name text,
  presence_id uuid,
  presence_status text,
  actual_assignment_id uuid,
  actual_worker_id uuid,
  actual_worker_name text,
  arrived_at timestamptz,
  departed_at timestamptz,
  operational_status text,
  arrived_after_start boolean,
  departed_before_end boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_organization_permission(
    list_presence_operational_day.target_organization_id,
    'presence:read'
  );

  return query
  select
    entry.id,
    schedule_item.id,
    revision.id,
    planned_assignment.id,
    entry.starts_at,
    entry.ends_at,
    client.id,
    client.trade_name,
    contract.id,
    contract.name,
    operation_item.id,
    operation_item.name,
    unit.id,
    unit.name,
    unit.timezone,
    position.id,
    job_role.id,
    job_role.name,
    original_worker.id,
    original_worker.full_name,
    reported_absence.id,
    reported_absence.reason,
    active_replacement.id,
    active_replacement.replacement_assignment_id,
    replacement_worker.id,
    replacement_worker.full_name,
    valid_presence.id,
    valid_presence.status,
    valid_presence.actual_assignment_id,
    actual_worker.id,
    actual_worker.full_name,
    valid_presence.arrived_at,
    valid_presence.departed_at,
    case
      when valid_presence.status = 'present' then 'present'
      when valid_presence.status = 'completed' then 'completed'
      when reported_absence.id is null then 'awaiting_confirmation'
      when active_replacement.id is null then 'uncovered_absence'
      else 'replacement_expected'
    end,
    coalesce(valid_presence.arrived_at > entry.starts_at, false),
    coalesce(
      valid_presence.status = 'completed'
      and valid_presence.departed_at < entry.ends_at,
      false
    )
  from public.schedule_entries entry
  join public.schedule_revisions revision
    on revision.id = entry.schedule_revision_id
   and revision.status = 'published'
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  join public.operations operation_item on operation_item.id = schedule_item.operation_id
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  join public.assignments planned_assignment on planned_assignment.id = entry.assignment_id
  join public.workers original_worker on original_worker.id = planned_assignment.worker_id
  join public.positions position on position.id = planned_assignment.position_id
  join public.job_roles job_role on job_role.id = position.job_role_id
  join public.units unit
    on unit.id = position.unit_id
   and unit.operation_id = operation_item.id
  left join lateral (
    select absence.id, absence.reason
    from public.absences absence
    where absence.schedule_entry_id = entry.id
      and absence.status = 'reported'
    limit 1
  ) reported_absence on true
  left join lateral (
    select replacement.id, replacement.replacement_assignment_id
    from public.replacements replacement
    where replacement.absence_id = reported_absence.id
      and replacement.status = 'active'
    limit 1
  ) active_replacement on true
  left join public.assignments replacement_assignment
    on replacement_assignment.id = active_replacement.replacement_assignment_id
  left join public.workers replacement_worker
    on replacement_worker.id = replacement_assignment.worker_id
  left join lateral (
    select presence.id, presence.status, presence.actual_assignment_id,
      presence.arrived_at, presence.departed_at
    from public.presences presence
    where presence.schedule_entry_id = entry.id
      and presence.status in ('present', 'completed')
    limit 1
  ) valid_presence on true
  left join public.assignments actual_assignment
    on actual_assignment.id = valid_presence.actual_assignment_id
  left join public.workers actual_worker on actual_worker.id = actual_assignment.worker_id
  where schedule_item.organization_id = list_presence_operational_day.target_organization_id
    and revision.version = (
      select max(published_revision.version)
      from public.schedule_revisions published_revision
      where published_revision.schedule_id = schedule_item.id
        and published_revision.status = 'published'
    )
    and (entry.starts_at at time zone unit.timezone)::date = list_presence_operational_day.target_date
    and (
      list_presence_operational_day.target_client_id is null
      or client.id = list_presence_operational_day.target_client_id
    )
    and (
      list_presence_operational_day.target_contract_id is null
      or contract.id = list_presence_operational_day.target_contract_id
    )
  order by entry.starts_at, operation_item.name, unit.name, job_role.name;
end;
$$;

revoke all on function public.list_presence_operational_day(uuid, date, uuid, uuid)
  from public, anon;
grant execute on function public.list_presence_operational_day(uuid, date, uuid, uuid)
  to authenticated;

comment on function public.list_presence_operational_day(uuid, date, uuid, uuid) is
  'Current official daily ScheduleEntry projection combining Absence, Replacement and valid Presence in Unit civil time.';
