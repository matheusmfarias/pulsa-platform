-- Phase 7B: narrow, Worker-owned Today and Schedule read models.
-- Identity is always derived from auth.uid() through private.require_worker_access().

create or replace function private.worker_schedule_entries(
  include_historical_presence boolean default false
)
returns table (
  schedule_entry_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  break_starts_at timestamptz,
  break_ends_at timestamptz,
  local_date date,
  operation_name text,
  unit_name text,
  unit_timezone text,
  unit_address text,
  unit_city text,
  unit_state text,
  job_role_name text,
  journey_status text,
  presence_status text,
  arrived_at timestamptz,
  departed_at timestamptz,
  schedule_version integer,
  published_at timestamptz,
  was_republished boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with worker_context as materialized (
    select * from private.require_worker_access()
  ),
  latest_published as materialized (
    select revision.schedule_id,
           max(revision.version) as version,
           count(*) as publication_count
    from public.schedule_revisions revision
    where revision.status = 'published'
    group by revision.schedule_id
  )
  select
    entry.id,
    entry.starts_at,
    entry.ends_at,
    entry.break_starts_at,
    entry.break_ends_at,
    (entry.starts_at at time zone unit.timezone)::date,
    operation_item.name,
    unit.name,
    unit.timezone,
    unit.address,
    unit.city,
    unit.state,
    job_role.name,
    case
      when own_presence.status = 'completed' then 'completed'
      when own_presence.status = 'present' then 'in_progress'
      when original_assignment.worker_id = worker_context.worker_id
        and reported_absence.id is not null
        and active_replacement.id is not null then 'original_replaced'
      when original_assignment.worker_id = worker_context.worker_id
        and reported_absence.id is not null then 'original_absent'
      when replacement_assignment.worker_id = worker_context.worker_id
        then 'replacement_expected'
      else 'original_expected'
    end,
    own_presence.status,
    own_presence.arrived_at,
    own_presence.departed_at,
    revision.version,
    revision.published_at,
    latest_published.publication_count > 1
  from worker_context
  join public.schedules schedule_item
    on schedule_item.organization_id = worker_context.organization_id
  join public.schedule_revisions revision
    on revision.schedule_id = schedule_item.id
   and revision.status = 'published'
  join latest_published
    on latest_published.schedule_id = revision.schedule_id
  join public.schedule_entries entry
    on entry.schedule_revision_id = revision.id
  join public.assignments original_assignment
    on original_assignment.id = entry.assignment_id
  join public.positions position
    on position.id = original_assignment.position_id
  join public.job_roles job_role
    on job_role.id = position.job_role_id
   and job_role.organization_id = worker_context.organization_id
  join public.units unit
    on unit.id = position.unit_id
  join public.operations operation_item
    on operation_item.id = unit.operation_id
   and operation_item.id = schedule_item.operation_id
  left join lateral (
    select absence.id
    from public.absences absence
    where absence.schedule_entry_id = entry.id
      and absence.organization_id = worker_context.organization_id
      and absence.status = 'reported'
    limit 1
  ) reported_absence on true
  left join lateral (
    select replacement.id, replacement.replacement_assignment_id
    from public.replacements replacement
    where replacement.absence_id = reported_absence.id
      and replacement.organization_id = worker_context.organization_id
      and replacement.status = 'active'
    limit 1
  ) active_replacement on true
  left join public.assignments replacement_assignment
    on replacement_assignment.id = active_replacement.replacement_assignment_id
  left join lateral (
    select presence.status, presence.arrived_at, presence.departed_at
    from public.presences presence
    join public.assignments actual_assignment
      on actual_assignment.id = presence.actual_assignment_id
    where presence.schedule_entry_id = entry.id
      and presence.organization_id = worker_context.organization_id
      and actual_assignment.worker_id = worker_context.worker_id
      and presence.status in ('present', 'completed')
    order by
      case presence.status when 'present' then 0 else 1 end,
      presence.created_at desc
    limit 1
  ) own_presence on true
  where (
      revision.version = latest_published.version
      or (
        include_historical_presence
        and own_presence.status in ('present', 'completed')
      )
    )
    and (
      original_assignment.worker_id = worker_context.worker_id
      or replacement_assignment.worker_id = worker_context.worker_id
      or own_presence.status in ('present', 'completed')
    );
$$;

create or replace function public.list_worker_schedule(
  from_date date,
  to_date date
)
returns table (
  schedule_entry_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  break_starts_at timestamptz,
  break_ends_at timestamptz,
  local_date date,
  operation_name text,
  unit_name text,
  unit_timezone text,
  unit_address text,
  unit_city text,
  unit_state text,
  job_role_name text,
  journey_status text,
  presence_status text,
  arrived_at timestamptz,
  departed_at timestamptz,
  schedule_version integer,
  published_at timestamptz,
  was_republished boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if from_date is null or to_date is null
    or to_date < from_date
    or to_date - from_date > 30 then
    raise exception 'Worker schedule interval must contain at most 31 civil days'
      using errcode = '22023';
  end if;

  return query
  select entry.*
  from private.worker_schedule_entries(false) entry
  where entry.local_date between list_worker_schedule.from_date
    and list_worker_schedule.to_date
  order by entry.starts_at, entry.schedule_entry_id;
end;
$$;

create or replace function public.get_worker_schedule_entry(
  target_schedule_entry_id uuid
)
returns table (
  schedule_entry_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  break_starts_at timestamptz,
  break_ends_at timestamptz,
  local_date date,
  operation_name text,
  unit_name text,
  unit_timezone text,
  unit_address text,
  unit_city text,
  unit_state text,
  job_role_name text,
  journey_status text,
  presence_status text,
  arrived_at timestamptz,
  departed_at timestamptz,
  schedule_version integer,
  published_at timestamptz,
  was_republished boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
  select entry.*
  from private.worker_schedule_entries(true) entry
  where entry.schedule_entry_id = get_worker_schedule_entry.target_schedule_entry_id;

  if not found then
    raise exception 'Worker schedule entry not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.get_worker_home()
returns table (
  home_slot text,
  schedule_entry_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  break_starts_at timestamptz,
  break_ends_at timestamptz,
  local_date date,
  operation_name text,
  unit_name text,
  unit_timezone text,
  unit_address text,
  unit_city text,
  unit_state text,
  job_role_name text,
  journey_status text,
  presence_status text,
  arrived_at timestamptz,
  departed_at timestamptz,
  schedule_version integer,
  published_at timestamptz,
  was_republished boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with entries as materialized (
    select * from private.worker_schedule_entries(false)
  ),
  current_entry as (
    select 'current'::text as home_slot, entry.*
    from entries entry
    where now() >= entry.starts_at and now() < entry.ends_at
    order by entry.starts_at, entry.schedule_entry_id
    limit 1
  ),
  today_entry as (
    select 'today'::text as home_slot, entry.*
    from entries entry
    where entry.local_date = (now() at time zone entry.unit_timezone)::date
      and not exists (
        select 1 from current_entry current_item
        where current_item.schedule_entry_id = entry.schedule_entry_id
      )
    order by
      case entry.journey_status
        when 'original_absent' then 0
        when 'original_replaced' then 0
        else 1
      end,
      entry.starts_at,
      entry.schedule_entry_id
    limit 1
  ),
  next_entry as (
    select 'next'::text as home_slot, entry.*
    from entries entry
    where entry.starts_at > now()
      and entry.journey_status in (
        'original_expected', 'replacement_expected', 'in_progress', 'completed'
      )
      and not exists (
        select 1 from current_entry current_item
        where current_item.schedule_entry_id = entry.schedule_entry_id
      )
      and not exists (
        select 1 from today_entry today_item
        where today_item.schedule_entry_id = entry.schedule_entry_id
      )
    order by entry.starts_at, entry.schedule_entry_id
    limit 1
  )
  select * from current_entry
  union all
  select * from today_entry
  union all
  select * from next_entry;
$$;

revoke all on function private.worker_schedule_entries(boolean)
  from public, anon, authenticated;
revoke all on function public.list_worker_schedule(date, date)
  from public, anon;
revoke all on function public.get_worker_schedule_entry(uuid)
  from public, anon;
revoke all on function public.get_worker_home()
  from public, anon;

grant execute on function public.list_worker_schedule(date, date)
  to authenticated;
grant execute on function public.get_worker_schedule_entry(uuid)
  to authenticated;
grant execute on function public.get_worker_home()
  to authenticated;

comment on function private.worker_schedule_entries(boolean) is
  'Minimized Worker-owned Schedule projection derived from auth.uid(); never exposes another Worker, Client or Contract.';
comment on function public.list_worker_schedule(date, date) is
  'Lists at most 31 civil days from the current official published revisions for the authenticated Worker.';
comment on function public.get_worker_schedule_entry(uuid) is
  'Returns one authorized Worker ScheduleEntry, including valid own Presence on a superseded published revision.';
comment on function public.get_worker_home() is
  'Returns current, today and next official journey slots for the authenticated Worker.';
