-- Phase 5 H2: database-side selector for uncovered Absences.
create or replace function public.list_uncovered_absence_ids(
  organization_id uuid,
  client_id uuid default null,
  contract_id uuid default null,
  result_limit integer default null
)
returns table (absence_id uuid, starts_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_organization_permission(
    list_uncovered_absence_ids.organization_id,
    'absence:read'
  );

  if result_limit is not null and result_limit <= 0 then
    raise exception 'Absence result limit must be positive'
      using errcode = '22023';
  end if;

  return query
  select absence.id, entry.starts_at
  from public.absences absence
  join public.schedule_entries entry
    on entry.id = absence.schedule_entry_id
  join public.schedule_revisions revision
    on revision.id = entry.schedule_revision_id
  join public.schedules schedule_item
    on schedule_item.id = revision.schedule_id
  join public.operations operation_item
    on operation_item.id = schedule_item.operation_id
  join public.contracts contract
    on contract.id = operation_item.contract_id
  where absence.organization_id = list_uncovered_absence_ids.organization_id
    and absence.status = 'reported'
    and (
      list_uncovered_absence_ids.client_id is null
      or contract.client_id = list_uncovered_absence_ids.client_id
    )
    and (
      list_uncovered_absence_ids.contract_id is null
      or contract.id = list_uncovered_absence_ids.contract_id
    )
    and not exists (
      select 1
      from public.replacements replacement
      where replacement.absence_id = absence.id
        and replacement.status = 'active'
    )
  order by entry.starts_at asc, absence.id asc
  limit coalesce(result_limit, 2147483647);
end;
$$;

revoke all on function public.list_uncovered_absence_ids(uuid, uuid, uuid, integer)
  from public, anon;
grant execute on function public.list_uncovered_absence_ids(uuid, uuid, uuid, integer)
  to authenticated;
