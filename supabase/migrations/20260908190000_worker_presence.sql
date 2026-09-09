-- Phase 7C: Worker self-service Presence on the existing Phase 6A aggregate.
-- Browser input never selects the principal, effective Assignment, source or time.

create or replace function private.lock_worker_access_context()
returns table (
  user_id uuid,
  worker_id uuid,
  organization_id uuid,
  worker_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  context record;
begin
  select * into context from private.require_worker_access();

  perform worker.id
  from public.workers worker
  where worker.id = context.worker_id
    and worker.organization_id = context.organization_id
    and worker.status = 'active'
  for update;
  if not found then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  perform access_link.id
  from public.worker_access_links access_link
  where access_link.profile_id = context.user_id
    and access_link.worker_id = context.worker_id
    and access_link.status = 'active'
  for update;
  if not found then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  perform organization.id
  from public.organizations organization
  where organization.id = context.organization_id
    and organization.status = 'active'
  for update;
  if not found then
    raise exception 'Worker access unavailable' using errcode = '42501';
  end if;

  return query select context.user_id, context.worker_id,
    context.organization_id, context.worker_name;
end;
$$;

create or replace function private.start_presence_core(
  target_organization_id uuid,
  target_schedule_entry_id uuid,
  target_arrived_at timestamptz,
  target_source text,
  target_source_reference text,
  target_idempotency_key text,
  target_actor_worker_id uuid,
  target_actor_surface text
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  entry_context record;
  reported_absence_id uuid;
  active_replacement record;
  assignment_context record;
  resolved_assignment_id uuid;
  resolved_replacement_id uuid;
  planned_start_date date;
  planned_end_date date;
  payload jsonb;
  actor_metadata jsonb := '{}'::jsonb;
  replayed public.presences;
  item public.presences;
begin
  perform private.validate_presence_source(target_source, target_source_reference);
  if target_arrived_at is null then
    raise exception 'Presence arrived_at is required' using errcode = '23514';
  end if;
  if target_actor_worker_id is not null then
    if target_actor_surface <> 'worker_app' or target_source <> 'app' then
      raise exception 'Invalid Worker Presence origin' using errcode = '23514';
    end if;
    payload := jsonb_build_object(
      'actor_worker_id', target_actor_worker_id,
      'schedule_entry_id', target_schedule_entry_id,
      'source', target_source,
      'source_reference', target_source_reference
    );
    actor_metadata := jsonb_build_object(
      'actor_worker_id', target_actor_worker_id,
      'actor_surface', target_actor_surface
    );
  else
    payload := jsonb_build_object(
      'schedule_entry_id', target_schedule_entry_id,
      'arrived_at', target_arrived_at,
      'source', target_source,
      'source_reference', target_source_reference
    );
  end if;

  replayed := private.replay_presence_command(
    target_organization_id, target_idempotency_key, 'create', payload
  );
  if replayed.id is not null then return replayed; end if;

  select schedule_item.organization_id,
         schedule_item.operation_id,
         revision.schedule_id,
         revision.version,
         revision.status as revision_status,
         entry.assignment_id as original_assignment_id,
         entry.starts_at,
         entry.ends_at,
         original_assignment.position_id,
         unit.timezone,
         client.organization_id as structural_organization_id
  into entry_context
  from public.schedule_entries entry
  join public.schedule_revisions revision
    on revision.id = entry.schedule_revision_id
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  join public.assignments original_assignment
    on original_assignment.id = entry.assignment_id
  join public.positions position on position.id = original_assignment.position_id
  join public.units unit on unit.id = position.unit_id
  join public.operations operation_item on operation_item.id = unit.operation_id
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  where entry.id = target_schedule_entry_id
  for update of entry, schedule_item;

  if not found then
    raise exception 'ScheduleEntry not found' using errcode = 'P0002';
  end if;
  if entry_context.organization_id <> target_organization_id
    or entry_context.structural_organization_id <> target_organization_id then
    raise exception 'Presence belongs to another Organization' using errcode = '23514';
  end if;
  if entry_context.revision_status <> 'published'
    or entry_context.version <> (
      select max(revision.version)
      from public.schedule_revisions revision
      where revision.schedule_id = entry_context.schedule_id
        and revision.status = 'published'
    ) then
    raise exception 'Presence can only start for the current published ScheduleEntry'
      using errcode = '23514';
  end if;

  select absence.id into reported_absence_id
  from public.absences absence
  where absence.schedule_entry_id = target_schedule_entry_id
    and absence.organization_id = target_organization_id
    and absence.status = 'reported'
  for update;

  if found then
    select replacement.id, replacement.replacement_assignment_id
    into active_replacement
    from public.replacements replacement
    where replacement.absence_id = reported_absence_id
      and replacement.organization_id = target_organization_id
      and replacement.status = 'active'
    for update;
    if not found then
      raise exception 'Presence cannot start for an uncovered Absence'
        using errcode = '23514';
    end if;
    resolved_assignment_id := active_replacement.replacement_assignment_id;
    resolved_replacement_id := active_replacement.id;
  else
    resolved_assignment_id := entry_context.original_assignment_id;
    resolved_replacement_id := null;
  end if;

  select assignment_item.worker_id,
         assignment_item.position_id,
         assignment_item.status as assignment_status,
         assignment_item.start_date,
         assignment_item.end_date,
         worker.organization_id,
         worker.status as worker_status,
         unit.operation_id,
         unit.timezone,
         client.organization_id as structural_organization_id
  into assignment_context
  from public.assignments assignment_item
  join public.workers worker on worker.id = assignment_item.worker_id
  join public.positions position on position.id = assignment_item.position_id
  join public.units unit on unit.id = position.unit_id
  join public.operations operation_item on operation_item.id = unit.operation_id
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  where assignment_item.id = resolved_assignment_id
  for update of assignment_item;

  if not found
    or assignment_context.organization_id <> target_organization_id
    or assignment_context.structural_organization_id <> target_organization_id
    or assignment_context.position_id <> entry_context.position_id
    or assignment_context.operation_id <> entry_context.operation_id
    or assignment_context.timezone <> entry_context.timezone then
    raise exception 'Presence Assignment context is invalid' using errcode = '23514';
  end if;

  if target_actor_worker_id is not null then
    planned_start_date := (
      entry_context.starts_at at time zone entry_context.timezone
    )::date;
    planned_end_date := (
      (entry_context.ends_at - interval '1 microsecond')
        at time zone entry_context.timezone
    )::date;
    if assignment_context.worker_id <> target_actor_worker_id
      or assignment_context.assignment_status not in ('pending', 'active')
      or assignment_context.worker_status <> 'active'
      or planned_start_date < assignment_context.start_date
      or (
        assignment_context.end_date is not null
        and planned_end_date > assignment_context.end_date
      )
      or not (
        (target_arrived_at at time zone entry_context.timezone)::date
          = planned_start_date
        or (
          entry_context.starts_at <= target_arrived_at
          and target_arrived_at < entry_context.ends_at
        )
      ) then
      raise exception 'Worker Presence action unavailable' using errcode = 'P0002';
    end if;
  end if;

  insert into public.presences (
    organization_id, schedule_entry_id, actual_assignment_id, replacement_id,
    status, arrived_at, source, source_reference, created_by
  ) values (
    target_organization_id, target_schedule_entry_id, resolved_assignment_id,
    resolved_replacement_id, 'present', target_arrived_at, target_source,
    nullif(btrim(target_source_reference), ''), actor_id
  ) returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    target_organization_id, actor_id, 'presence', item.id, 'record_arrival',
    jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', to_jsonb(item),
      'changes', jsonb_build_array(
        'schedule_entry_id', 'actual_assignment_id', 'replacement_id',
        'status', 'arrived_at', 'source', 'source_reference'
      ),
      'command_source', target_source,
      'command_source_reference', target_source_reference
    ) || actor_metadata
  );

  perform private.finish_presence_command(
    target_organization_id, target_idempotency_key, 'create', payload, item
  );
  return item;
end;
$$;

create or replace function private.start_presence(
  target_organization_id uuid,
  target_schedule_entry_id uuid,
  target_arrived_at timestamptz,
  target_source text,
  target_source_reference text,
  target_idempotency_key text
)
returns public.presences
language sql
security definer
set search_path = ''
as $$
  select private.start_presence_core(
    target_organization_id, target_schedule_entry_id, target_arrived_at,
    target_source, target_source_reference, target_idempotency_key, null, null
  );
$$;

create or replace function private.complete_presence_core(
  target_organization_id uuid,
  target_presence_id uuid,
  target_departed_at timestamptz,
  target_source text,
  target_source_reference text,
  target_idempotency_key text,
  target_actor_worker_id uuid,
  target_actor_surface text,
  target_schedule_entry_id uuid
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  old_item public.presences;
  item public.presences;
  replayed public.presences;
  payload jsonb;
  actor_metadata jsonb := '{}'::jsonb;
  command_source_reference text := target_source_reference;
  completion_recorded_at timestamptz;
begin
  if target_actor_worker_id is not null then
    if target_actor_surface <> 'worker_app' or target_source <> 'app'
      or target_presence_id is not null or target_schedule_entry_id is null then
      raise exception 'Invalid Worker Presence origin' using errcode = '23514';
    end if;
    payload := jsonb_build_object(
      'actor_worker_id', target_actor_worker_id,
      'schedule_entry_id', target_schedule_entry_id,
      'source', target_source
    );
    actor_metadata := jsonb_build_object(
      'actor_worker_id', target_actor_worker_id,
      'actor_surface', target_actor_surface
    );
  else
    perform private.validate_presence_source(target_source, target_source_reference);
    payload := jsonb_build_object(
      'presence_id', target_presence_id,
      'departed_at', target_departed_at,
      'source', target_source,
      'source_reference', target_source_reference
    );
  end if;

  replayed := private.replay_presence_command(
    target_organization_id, target_idempotency_key, 'complete', payload
  );
  if replayed.id is not null then return replayed; end if;

  if target_actor_worker_id is not null then
    select presence.* into old_item
    from public.presences presence
    join public.assignments actual_assignment
      on actual_assignment.id = presence.actual_assignment_id
    where presence.organization_id = target_organization_id
      and presence.schedule_entry_id = target_schedule_entry_id
      and presence.status = 'present'
      and actual_assignment.worker_id = target_actor_worker_id
    for update of presence;
  else
    select presence.* into old_item
    from public.presences presence
    where presence.id = target_presence_id
    for update;
  end if;

  if not found then
    raise exception 'Presence not found' using errcode = 'P0002';
  end if;
  if old_item.organization_id <> target_organization_id then
    raise exception 'Presence belongs to another Organization' using errcode = '23514';
  end if;
  if target_departed_at is null or target_departed_at <= old_item.arrived_at then
    raise exception 'Presence departed_at must be after arrived_at'
      using errcode = '23514';
  end if;

  if target_actor_worker_id is null
    and old_item.status = 'completed'
    and old_item.departed_at = target_departed_at then
    perform private.finish_presence_command(
      target_organization_id, target_idempotency_key, 'complete', payload, old_item
    );
    return old_item;
  end if;
  if old_item.status <> 'present' then
    raise exception 'Only a present Presence can be completed'
      using errcode = '23514';
  end if;

  if target_actor_worker_id is not null then
    command_source_reference := coalesce(old_item.source_reference, old_item.id::text);
    perform private.validate_presence_source('app', command_source_reference);
    completion_recorded_at := target_departed_at;
  else
    completion_recorded_at := now();
  end if;

  update public.presences
  set status = 'completed',
      departed_at = target_departed_at,
      completed_at = completion_recorded_at,
      completed_by = actor_id
  where id = old_item.id
  returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    target_organization_id, actor_id, 'presence', item.id, 'record_departure',
    public.build_audit_metadata(
      to_jsonb(old_item), to_jsonb(item),
      array['status', 'departed_at', 'completed_at', 'completed_by']::text[]
    ) || jsonb_build_object(
      'command_source', target_source,
      'command_source_reference', command_source_reference
    ) || actor_metadata
  );

  perform private.finish_presence_command(
    target_organization_id, target_idempotency_key, 'complete', payload, item
  );
  return item;
end;
$$;

create or replace function private.complete_presence(
  target_organization_id uuid,
  target_presence_id uuid,
  target_departed_at timestamptz,
  target_source text,
  target_source_reference text,
  target_idempotency_key text
)
returns public.presences
language sql
security definer
set search_path = ''
as $$
  select private.complete_presence_core(
    target_organization_id, target_presence_id, target_departed_at,
    target_source, target_source_reference, target_idempotency_key,
    null, null, null
  );
$$;

create or replace function private.worker_start_presence(
  target_schedule_entry_id uuid,
  target_source_reference text,
  target_idempotency_key text
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
declare
  context record;
  source_reference_uuid uuid;
begin
  select * into context from private.lock_worker_access_context();
  begin
    source_reference_uuid := btrim(target_source_reference)::uuid;
  exception when invalid_text_representation then
    raise exception 'Invalid Worker Presence source reference'
      using errcode = '22023';
  end;
  if source_reference_uuid is null then
    raise exception 'Invalid Worker Presence source reference'
      using errcode = '22023';
  end if;
  return private.start_presence_core(
    context.organization_id, target_schedule_entry_id, clock_timestamp(),
    'app', source_reference_uuid::text, target_idempotency_key,
    context.worker_id, 'worker_app'
  );
end;
$$;

create or replace function private.worker_complete_presence(
  target_schedule_entry_id uuid,
  target_idempotency_key text
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
declare context record;
begin
  select * into context from private.lock_worker_access_context();
  return private.complete_presence_core(
    context.organization_id, null, clock_timestamp(), 'app', null,
    target_idempotency_key, context.worker_id, 'worker_app',
    target_schedule_entry_id
  );
end;
$$;

create or replace function public.worker_start_presence(
  schedule_entry_id uuid,
  source_reference text,
  idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare item public.presences;
begin
  item := private.worker_start_presence(
    worker_start_presence.schedule_entry_id,
    worker_start_presence.source_reference,
    worker_start_presence.idempotency_key
  );
  return jsonb_build_object(
    'schedule_entry_id', item.schedule_entry_id,
    'status', item.status,
    'arrived_at', item.arrived_at,
    'departed_at', item.departed_at
  );
end;
$$;

create or replace function public.worker_complete_presence(
  schedule_entry_id uuid,
  idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare item public.presences;
begin
  item := private.worker_complete_presence(
    worker_complete_presence.schedule_entry_id,
    worker_complete_presence.idempotency_key
  );
  return jsonb_build_object(
    'schedule_entry_id', item.schedule_entry_id,
    'status', item.status,
    'arrived_at', item.arrived_at,
    'departed_at', item.departed_at
  );
end;
$$;

create or replace function public.get_worker_presence_action(
  schedule_entry_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  context record;
  own_presence_status text;
  entry_context record;
begin
  select * into context from private.require_worker_access();

  select presence.status into own_presence_status
  from public.presences presence
  join public.assignments actual_assignment
    on actual_assignment.id = presence.actual_assignment_id
  where presence.organization_id = context.organization_id
    and presence.schedule_entry_id = get_worker_presence_action.schedule_entry_id
    and presence.status in ('present', 'completed')
    and actual_assignment.worker_id = context.worker_id
  order by case presence.status when 'present' then 0 else 1 end,
    presence.created_at desc
  limit 1;

  if own_presence_status = 'present' then return 'complete'; end if;
  if own_presence_status = 'completed' then return null; end if;

  select entry.starts_at,
         entry.ends_at,
         unit.timezone,
         assignment_item.status as assignment_status,
         assignment_item.start_date,
         assignment_item.end_date,
         assignment_item.worker_id,
         worker.status as worker_status,
         schedule_item.organization_id,
         client.organization_id as structural_organization_id,
         (entry.starts_at at time zone unit.timezone)::date as planned_start_date,
         ((entry.ends_at - interval '1 microsecond') at time zone unit.timezone)::date
           as planned_end_date
  into entry_context
  from public.schedule_entries entry
  join public.schedule_revisions revision
    on revision.id = entry.schedule_revision_id
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  left join public.absences absence
    on absence.schedule_entry_id = entry.id and absence.status = 'reported'
  left join public.replacements replacement
    on replacement.absence_id = absence.id and replacement.status = 'active'
  join public.assignments assignment_item
    on assignment_item.id = case
      when absence.id is null then entry.assignment_id
      else replacement.replacement_assignment_id
    end
  join public.workers worker on worker.id = assignment_item.worker_id
  join public.positions position on position.id = assignment_item.position_id
  join public.units unit on unit.id = position.unit_id
  join public.operations operation_item on operation_item.id = unit.operation_id
    and operation_item.id = schedule_item.operation_id
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  where entry.id = get_worker_presence_action.schedule_entry_id
    and revision.status = 'published'
    and revision.version = (
      select max(published_revision.version)
      from public.schedule_revisions published_revision
      where published_revision.schedule_id = revision.schedule_id
        and published_revision.status = 'published'
    )
    and (absence.id is null or replacement.id is not null);

  if not found
    or entry_context.organization_id <> context.organization_id
    or entry_context.structural_organization_id <> context.organization_id
    or entry_context.worker_id <> context.worker_id
    or entry_context.worker_status <> 'active'
    or entry_context.assignment_status not in ('pending', 'active')
    or entry_context.planned_start_date < entry_context.start_date
    or (
      entry_context.end_date is not null
      and entry_context.planned_end_date > entry_context.end_date
    )
    or not (
      (now() at time zone entry_context.timezone)::date
        = entry_context.planned_start_date
      or (
        entry_context.starts_at <= now()
        and now() < entry_context.ends_at
      )
    ) then
    return null;
  end if;

  return 'start';
end;
$$;

create or replace function public.list_worker_presence_history(
  result_limit integer default 30,
  before_arrived_at timestamptz default null,
  before_schedule_entry_id uuid default null
)
returns table (
  schedule_entry_id uuid,
  presence_status text,
  arrived_at timestamptz,
  departed_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  local_date date,
  operation_name text,
  unit_name text,
  unit_timezone text,
  job_role_name text,
  worker_role text,
  arrived_after_start boolean,
  departed_before_end boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if result_limit is null or result_limit not between 1 and 50
    or ((before_arrived_at is null) <> (before_schedule_entry_id is null)) then
    raise exception 'Invalid Worker Presence history pagination'
      using errcode = '22023';
  end if;

  return query
  with context as materialized (
    select * from private.require_worker_access()
  )
  select presence.schedule_entry_id,
         presence.status,
         presence.arrived_at,
         presence.departed_at,
         entry.starts_at,
         entry.ends_at,
         (entry.starts_at at time zone unit.timezone)::date,
         operation_item.name,
         unit.name,
         unit.timezone,
         job_role.name,
         case when presence.replacement_id is null
           then 'original' else 'replacement' end,
         presence.arrived_at > entry.starts_at,
         presence.departed_at is not null
           and presence.departed_at < entry.ends_at
  from context
  join public.presences presence
    on presence.organization_id = context.organization_id
   and presence.status in ('present', 'completed')
  join public.assignments actual_assignment
    on actual_assignment.id = presence.actual_assignment_id
   and actual_assignment.worker_id = context.worker_id
  join public.schedule_entries entry on entry.id = presence.schedule_entry_id
  join public.positions position on position.id = actual_assignment.position_id
  join public.job_roles job_role on job_role.id = position.job_role_id
   and job_role.organization_id = context.organization_id
  join public.units unit on unit.id = position.unit_id
  join public.operations operation_item on operation_item.id = unit.operation_id
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
   and client.organization_id = context.organization_id
  where before_arrived_at is null
     or (presence.arrived_at, presence.schedule_entry_id)
        < (before_arrived_at, before_schedule_entry_id)
  order by presence.arrived_at desc, presence.schedule_entry_id desc
  limit result_limit;
end;
$$;

revoke all on function private.lock_worker_access_context()
  from public, anon, authenticated;
revoke all on function private.start_presence_core(
  uuid, uuid, timestamptz, text, text, text, uuid, text
) from public, anon, authenticated;
revoke all on function private.complete_presence_core(
  uuid, uuid, timestamptz, text, text, text, uuid, text, uuid
) from public, anon, authenticated;
revoke all on function private.worker_start_presence(uuid, text, text)
  from public, anon, authenticated;
revoke all on function private.worker_complete_presence(uuid, text)
  from public, anon, authenticated;

revoke all on function public.worker_start_presence(uuid, text, text)
  from public, anon;
revoke all on function public.worker_complete_presence(uuid, text)
  from public, anon;
revoke all on function public.get_worker_presence_action(uuid)
  from public, anon;
revoke all on function public.list_worker_presence_history(integer, timestamptz, uuid)
  from public, anon;

grant execute on function public.worker_start_presence(uuid, text, text)
  to authenticated;
grant execute on function public.worker_complete_presence(uuid, text)
  to authenticated;
grant execute on function public.get_worker_presence_action(uuid)
  to authenticated;
grant execute on function public.list_worker_presence_history(integer, timestamptz, uuid)
  to authenticated;

comment on function public.worker_start_presence(uuid, text, text) is
  'Starts the authenticated Worker own eligible Presence using database time and stable idempotency.';
comment on function public.worker_complete_presence(uuid, text) is
  'Completes the authenticated Worker own open Presence using database time and its stored source reference.';
comment on function private.start_presence_core(
  uuid, uuid, timestamptz, text, text, text, uuid, text
) is
  'Shared Backoffice and Worker core for authoritative Assignment resolution, locks, receipt, persistence and audit.';
comment on function private.complete_presence_core(
  uuid, uuid, timestamptz, text, text, text, uuid, text, uuid
) is
  'Shared Backoffice and Worker core for Presence lifecycle, locks, receipt, persistence and audit.';
comment on function public.get_worker_presence_action(uuid) is
  'Returns only start, complete or null as non-authoritative Worker Presence UX guidance.';
comment on function public.list_worker_presence_history(integer, timestamptz, uuid) is
  'Returns a minimized cursor-paginated history of the authenticated Worker own valid Presences.';
