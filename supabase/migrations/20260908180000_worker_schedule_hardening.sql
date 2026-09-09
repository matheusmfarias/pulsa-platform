-- Phase 7B.1: keep an unfinished own Presence actionable after republication
-- and derive the Schedule UI anchor from an operational Unit timezone.

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
  with official_entries as materialized (
    select * from private.worker_schedule_entries(false)
  ),
  own_historical_entries as materialized (
    select * from private.worker_schedule_entries(true)
  ),
  ongoing_presence as (
    select 'current'::text as home_slot, entry.*
    from own_historical_entries entry
    where entry.presence_status = 'present'
    order by entry.arrived_at desc nulls last, entry.schedule_entry_id
    limit 1
  ),
  planned_current as (
    select 'current'::text as home_slot, entry.*
    from official_entries entry
    where now() >= entry.starts_at and now() < entry.ends_at
    order by entry.starts_at, entry.schedule_entry_id
    limit 1
  ),
  current_entry as (
    select * from ongoing_presence
    union all
    select * from planned_current
    where not exists (select 1 from ongoing_presence)
  ),
  today_entry as (
    select 'today'::text as home_slot, entry.*
    from official_entries entry
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
    from official_entries entry
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

create or replace function public.get_worker_schedule_anchor_date()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  with official_entries as materialized (
    select * from private.worker_schedule_entries(false)
  ),
  chosen_entry as (
    select entry.unit_timezone
    from official_entries entry
    order by
      case
        when now() >= entry.starts_at and now() < entry.ends_at then 0
        when entry.starts_at > now() then 1
        else 2
      end,
      case
        when now() >= entry.starts_at and now() < entry.ends_at
          then entry.starts_at
      end,
      case when entry.starts_at > now() then entry.starts_at end,
      case when entry.starts_at <= now() then entry.starts_at end desc,
      entry.schedule_entry_id
    limit 1
  )
  select (now() at time zone chosen_entry.unit_timezone)::date
  from chosen_entry;
$$;

revoke all on function public.get_worker_home() from public, anon;
revoke all on function public.get_worker_schedule_anchor_date()
  from public, anon;

grant execute on function public.get_worker_home() to authenticated;
grant execute on function public.get_worker_schedule_anchor_date()
  to authenticated;

comment on function public.get_worker_home() is
  'Returns an unfinished own Presence first, including from a superseded publication, then only official current expectations.';
comment on function public.get_worker_schedule_anchor_date() is
  'Returns today in the most relevant official Unit timezone for the authenticated Worker; null means no operational timezone is available.';
