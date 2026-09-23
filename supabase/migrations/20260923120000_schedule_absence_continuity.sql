-- Carry a live Absence/Replacement forward without cloning their history.
alter table public.schedule_entries
  add column inherited_absence_id uuid null references public.absences(id) on delete set null;
create index schedule_entries_inherited_absence_id_idx
  on public.schedule_entries (inherited_absence_id) where inherited_absence_id is not null;

-- Permit the migration's metadata-only backfill on published rows. All operational
-- ScheduleEntry fields remain immutable unless their revision is a draft.
create or replace function private.enforce_schedule_entry_editability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_status text;
begin
  if tg_op = 'UPDATE'
    and new.inherited_absence_id is distinct from old.inherited_absence_id
    and new.id is not distinct from old.id
    and new.schedule_revision_id is not distinct from old.schedule_revision_id
    and new.assignment_id is not distinct from old.assignment_id
    and new.starts_at is not distinct from old.starts_at
    and new.ends_at is not distinct from old.ends_at
    and new.break_starts_at is not distinct from old.break_starts_at
    and new.break_ends_at is not distinct from old.break_ends_at
    and new.created_at is not distinct from old.created_at
    and new.created_by is not distinct from old.created_by then
    return new;
  end if;

  if tg_op = 'UPDATE' and (
    new.schedule_revision_id is distinct from old.schedule_revision_id
    or new.created_at is distinct from old.created_at
    or new.created_by is distinct from old.created_by
  ) then
    raise exception 'ScheduleEntry revision and creation metadata are immutable'
      using errcode = '23514';
  end if;

  select revision.status into target_status
  from public.schedule_revisions revision
  where revision.id = case when tg_op = 'DELETE'
    then old.schedule_revision_id else new.schedule_revision_id end
  for update;

  if target_status is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;
  if target_status <> 'draft' then
    raise exception 'ScheduleEntry can only be changed in a draft revision'
      using errcode = '23514';
  end if;

  if tg_op <> 'DELETE' then
    perform private.validate_schedule_entry_values(
      new.schedule_revision_id,
      new.assignment_id,
      new.starts_at,
      new.ends_at,
      new.break_starts_at,
      new.break_ends_at
    );
    return new;
  end if;
  return old;
end;
$$;

-- Repair already-published current revisions by following their ancestry and matching
-- the same Assignment and exact planned interval.
with recursive current_entries as (
  select entry.id as current_entry_id, entry.assignment_id, entry.starts_at, entry.ends_at,
         revision.based_on_revision_id
  from public.schedule_entries entry
  join public.schedule_revisions revision on revision.id = entry.schedule_revision_id
  where revision.status = 'published'
    and revision.version = (select max(latest.version) from public.schedule_revisions latest
      where latest.schedule_id = revision.schedule_id and latest.status = 'published')
), ancestry as (
  select current_entry_id, assignment_id, starts_at, ends_at,
         based_on_revision_id as ancestor_revision_id, 1 as depth
  from current_entries where based_on_revision_id is not null
  union all
  select ancestry.current_entry_id, ancestry.assignment_id, ancestry.starts_at, ancestry.ends_at,
         parent.based_on_revision_id, ancestry.depth + 1
  from ancestry join public.schedule_revisions parent on parent.id = ancestry.ancestor_revision_id
  where parent.based_on_revision_id is not null
), candidates as (
  select ancestry.current_entry_id, coalesce(direct_absence.id, inherited_absence.id) as absence_id,
         row_number() over (partition by ancestry.current_entry_id order by ancestry.depth) as rank
  from ancestry
  join public.schedule_entries ancestor_entry
    on ancestor_entry.schedule_revision_id = ancestry.ancestor_revision_id
   and ancestor_entry.assignment_id = ancestry.assignment_id
   and ancestor_entry.starts_at = ancestry.starts_at
   and ancestor_entry.ends_at = ancestry.ends_at
  left join lateral (
    select absence.id from public.absences absence
    where absence.schedule_entry_id = ancestor_entry.id and absence.status = 'reported' limit 1
  ) direct_absence on true
  left join public.absences inherited_absence
    on inherited_absence.id = ancestor_entry.inherited_absence_id and inherited_absence.status = 'reported'
  where direct_absence.id is not null or inherited_absence.id is not null
)
update public.schedule_entries current_entry
set inherited_absence_id = candidates.absence_id
from candidates where current_entry.id = candidates.current_entry_id and candidates.rank = 1;

create or replace function private.clear_changed_entry_absence_inheritance()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assignment_id is distinct from old.assignment_id
    or new.starts_at is distinct from old.starts_at
    or new.ends_at is distinct from old.ends_at then
    new.inherited_absence_id := null;
  end if;
  return new;
end;
$$;
create trigger clear_changed_entry_absence_inheritance
before update of assignment_id, starts_at, ends_at on public.schedule_entries
for each row execute function private.clear_changed_entry_absence_inheritance();

create or replace function private.create_schedule_revision_from_published(
  source_revision_id uuid
)
returns public.schedule_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  source_revision public.schedule_revisions;
  new_revision public.schedule_revisions;
  organization_id uuid;
  next_version integer;
  copied_entries integer;
begin
  select revision.* into source_revision
  from public.schedule_revisions revision
  where revision.id = source_revision_id;
  if not found then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;
  if source_revision.status <> 'published' then
    raise exception 'Source ScheduleRevision must be published'
      using errcode = '23514';
  end if;

  select schedule_item.organization_id into organization_id
  from public.schedules schedule_item
  where schedule_item.id = source_revision.schedule_id
  for update;
  if not found then
    raise exception 'Schedule not found' using errcode = 'P0002';
  end if;

  select coalesce(max(revision.version), 0) + 1 into next_version
  from public.schedule_revisions revision
  where revision.schedule_id = source_revision.schedule_id;

  insert into public.schedule_revisions (
    schedule_id, version, status, based_on_revision_id, created_by
  ) values (
    source_revision.schedule_id,
    next_version,
    'draft',
    source_revision.id,
    actor_id
  ) returning * into new_revision;

  insert into public.schedule_entries (
    schedule_revision_id,
    assignment_id,
    starts_at,
    ends_at,
    break_starts_at,
    break_ends_at,
    inherited_absence_id,
    created_by
  )
  select
    new_revision.id,
    entry.assignment_id,
    entry.starts_at,
    entry.ends_at,
    entry.break_starts_at,
    entry.break_ends_at,
    coalesce(direct_absence.id, inherited_absence.id),
    actor_id
  from public.schedule_entries entry
  left join lateral (
    select absence.id from public.absences absence
    where absence.schedule_entry_id = entry.id
      and absence.status = 'reported'
    limit 1
  ) direct_absence on true
  left join public.absences inherited_absence
    on inherited_absence.id = entry.inherited_absence_id
   and inherited_absence.status = 'reported'
  where entry.schedule_revision_id = source_revision.id;
  get diagnostics copied_entries = row_count;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    organization_id,
    actor_id,
    'schedule_revision',
    new_revision.id,
    'create_from_published',
    jsonb_build_object(
      'previous_state', jsonb_build_object(
        'source_revision_id', source_revision.id,
        'source_version', source_revision.version,
        'source_status', source_revision.status
      ),
      'new_state', jsonb_build_object(
        'schedule_id', new_revision.schedule_id,
        'version', new_revision.version,
        'status', new_revision.status,
        'based_on_revision_id', new_revision.based_on_revision_id,
        'copied_entries', copied_entries
      ),
      'changes', jsonb_build_array(
        'version', 'status', 'based_on_revision_id', 'entries'
      )
    )
  );
  return new_revision;
end;
$$;

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
    where absence.organization_id = worker_context.organization_id
      and absence.status = 'reported'
      and (absence.schedule_entry_id = entry.id or absence.id = entry.inherited_absence_id)
    order by case when absence.schedule_entry_id = entry.id then 0 else 1 end
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
      and presence.actual_assignment_id = case
        when reported_absence.id is not null then replacement_assignment.id
        else original_assignment.id
      end
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
         entry.inherited_absence_id,
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
  where (absence.schedule_entry_id = target_schedule_entry_id
      or absence.id = entry_context.inherited_absence_id)
    and absence.organization_id = target_organization_id
    and absence.status = 'reported'
  order by case when absence.schedule_entry_id = target_schedule_entry_id then 0 else 1 end
  limit 1
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

create or replace function private.enforce_presence_context()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  entry_organization_id uuid;
  original_assignment_id uuid;
  inherited_absence_id uuid;
  replacement_context record;
begin
  select schedule_item.organization_id, entry.assignment_id, entry.inherited_absence_id
  into entry_organization_id, original_assignment_id, inherited_absence_id
  from public.schedule_entries entry
  join public.schedule_revisions revision on revision.id = entry.schedule_revision_id
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where entry.id = new.schedule_entry_id;
  if not found then raise exception 'ScheduleEntry not found' using errcode = 'P0002'; end if;
  if new.organization_id <> entry_organization_id then
    raise exception 'Presence and ScheduleEntry must belong to the same Organization' using errcode = '23514';
  end if;
  if new.replacement_id is null then
    if exists (select 1 from public.absences absence where absence.status = 'reported'
      and (absence.schedule_entry_id = new.schedule_entry_id or absence.id = inherited_absence_id)) then
      raise exception 'Presence without Replacement conflicts with a reported Absence' using errcode = '23514';
    end if;
    if new.actual_assignment_id <> original_assignment_id then
      raise exception 'Presence actual Assignment must be resolved by the database' using errcode = '23514';
    end if;
  else
    select replacement.organization_id, absence.schedule_entry_id, absence.id as absence_id,
           replacement.replacement_assignment_id, replacement.status as replacement_status,
           absence.status as absence_status
    into replacement_context
    from public.replacements replacement
    join public.absences absence on absence.id = replacement.absence_id
    where replacement.id = new.replacement_id;
    if not found
       or replacement_context.organization_id <> new.organization_id
       or (replacement_context.schedule_entry_id <> new.schedule_entry_id
           and replacement_context.absence_id <> inherited_absence_id)
       or replacement_context.replacement_assignment_id <> new.actual_assignment_id
       or replacement_context.replacement_status <> 'active'
       or replacement_context.absence_status <> 'reported' then
      raise exception 'Presence Replacement context is invalid' using errcode = '23514';
    end if;
  end if;
  return new;
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
    and (
      (
        presence.replacement_id is null
        and presence.actual_assignment_id = (
          select entry.assignment_id
          from public.schedule_entries entry
          where entry.id = presence.schedule_entry_id
        )
        and not exists (
          select 1
          from public.schedule_entries entry
          join public.absences absence
            on absence.schedule_entry_id = entry.id
            or absence.id = entry.inherited_absence_id
          where entry.id = presence.schedule_entry_id
            and absence.organization_id = context.organization_id
            and absence.status = 'reported'
        )
      )
      or exists (
        select 1
        from public.schedule_entries entry
        join public.absences absence
          on absence.schedule_entry_id = entry.id
          or absence.id = entry.inherited_absence_id
        join public.replacements replacement
          on replacement.absence_id = absence.id
         and replacement.status = 'active'
        where entry.id = presence.schedule_entry_id
          and absence.organization_id = context.organization_id
          and absence.status = 'reported'
          and replacement.id = presence.replacement_id
          and replacement.replacement_assignment_id = presence.actual_assignment_id
      )
    )
  order by case presence.status when 'present' then 0 else 1 end,
    presence.created_at desc
  limit 1;

  if own_presence_status = 'present' then return 'complete'; end if;
  if own_presence_status = 'completed' then return null; end if;

  select entry.starts_at,
         entry.ends_at,
         entry.inherited_absence_id,
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
  left join lateral (
    select candidate.id from public.absences candidate
    where candidate.status = 'reported'
      and (candidate.schedule_entry_id = entry.id or candidate.id = entry.inherited_absence_id)
    order by case when candidate.schedule_entry_id = entry.id then 0 else 1 end
    limit 1
  ) absence on true
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
    where absence.status = 'reported'
      and (absence.schedule_entry_id = entry.id or absence.id = entry.inherited_absence_id)
    order by case when absence.schedule_entry_id = entry.id then 0 else 1 end
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
      and presence.actual_assignment_id = case
        when reported_absence.id is not null then active_replacement.replacement_assignment_id
        else planned_assignment.id
      end
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

create or replace function private.prevent_duplicate_inherited_absence()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.schedule_entries entry
    join public.absences inherited on inherited.id = entry.inherited_absence_id
    where entry.id = new.schedule_entry_id and inherited.status = 'reported') then
    raise exception 'ScheduleEntry already inherits a reported Absence' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger prevent_duplicate_inherited_absence before insert on public.absences
for each row execute function private.prevent_duplicate_inherited_absence();

revoke all on function private.clear_changed_entry_absence_inheritance() from public, anon, authenticated;
revoke all on function private.prevent_duplicate_inherited_absence() from public, anon, authenticated;
revoke all on function private.create_schedule_revision_from_published(uuid) from public, anon, authenticated;
revoke all on function private.worker_schedule_entries(boolean) from public, anon, authenticated;
revoke all on function private.start_presence_core(uuid, uuid, timestamptz, text, text, text, uuid, text) from public, anon, authenticated;
revoke all on function private.enforce_presence_context() from public, anon, authenticated;
revoke all on function public.get_worker_presence_action(uuid) from public, anon;
revoke all on function public.list_presence_operational_day(uuid, date, uuid, uuid) from public, anon;
grant execute on function public.get_worker_presence_action(uuid) to authenticated;
grant execute on function public.list_presence_operational_day(uuid, date, uuid, uuid) to authenticated;
