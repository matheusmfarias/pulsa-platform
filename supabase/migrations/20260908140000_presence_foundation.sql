-- Phase 6A: authoritative operational Presence foundation.
-- Planned = ScheduleEntry, Exception = Absence, Coverage = Replacement,
-- Actual = Presence. Presence never rewrites the other three records.

create table public.presences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  schedule_entry_id uuid not null references public.schedule_entries(id) on delete restrict,
  actual_assignment_id uuid not null references public.assignments(id) on delete restrict,
  replacement_id uuid references public.replacements(id) on delete restrict,
  status text not null default 'present',
  arrived_at timestamptz not null,
  departed_at timestamptz,
  source text not null,
  source_reference text,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete restrict,
  corrected_at timestamptz,
  corrected_by uuid references public.profiles(id) on delete restrict,
  correction_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete restrict,
  cancellation_reason text,
  constraint presences_status_valid check (
    status in ('present', 'completed', 'cancelled')
  ),
  constraint presences_source_valid check (
    source in ('manual', 'app', 'integration')
  ),
  constraint presences_source_reference_valid check (
    source_reference is null or (
      char_length(btrim(source_reference)) between 1 and 500
    )
  ),
  constraint presences_external_source_reference_required check (
    source = 'manual' or source_reference is not null
  ),
  constraint presences_departure_valid check (
    departed_at is null or departed_at > arrived_at
  ),
  constraint presences_completion_metadata_pair check (
    (completed_at is null and completed_by is null) or
    (completed_at is not null and completed_by is not null)
  ),
  constraint presences_correction_metadata_valid check (
    (
      corrected_at is null and corrected_by is null and correction_reason is null
    ) or (
      corrected_at is not null and corrected_by is not null and
      correction_reason is not null and
      char_length(btrim(correction_reason)) between 1 and 1000
    )
  ),
  constraint presences_cancellation_metadata_valid check (
    (
      cancelled_at is null and cancelled_by is null and cancellation_reason is null
    ) or (
      cancelled_at is not null and cancelled_by is not null and
      cancellation_reason is not null and
      char_length(btrim(cancellation_reason)) between 1 and 1000
    )
  ),
  constraint presences_lifecycle_valid check (
    (
      status = 'present' and departed_at is null and
      completed_at is null and completed_by is null and
      cancelled_at is null and cancelled_by is null and cancellation_reason is null
    ) or (
      status = 'completed' and departed_at is not null and
      completed_at is not null and completed_by is not null and
      cancelled_at is null and cancelled_by is null and cancellation_reason is null
    ) or (
      status = 'cancelled' and
      cancelled_at is not null and cancelled_by is not null and
      cancellation_reason is not null
    )
  )
);

create unique index presences_one_current_per_schedule_entry_idx
  on public.presences (schedule_entry_id)
  where status in ('present', 'completed');

create unique index presences_external_source_reference_idx
  on public.presences (organization_id, source, source_reference)
  where source_reference is not null;

create index presences_organization_arrived_at_idx
  on public.presences (organization_id, arrived_at desc);

create index presences_actual_assignment_arrived_at_idx
  on public.presences (actual_assignment_id, arrived_at desc);

create table private.presence_command_receipts (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  idempotency_key text not null,
  command text not null,
  request_hash text not null,
  presence_id uuid not null references public.presences(id) on delete cascade,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, idempotency_key),
  constraint presence_command_receipts_key_valid check (
    char_length(btrim(idempotency_key)) between 1 and 200
  ),
  constraint presence_command_receipts_command_valid check (
    command in ('create', 'complete', 'correct', 'cancel')
  )
);

alter table public.presences enable row level security;

create policy "Members with presence read can read presences"
on public.presences for select to authenticated
using (
  public.has_organization_permission(organization_id, 'presence:read')
);

revoke all on table public.presences from anon, authenticated;
grant select on table public.presences to authenticated;
revoke all on table private.presence_command_receipts from public, anon, authenticated;

-- Keep the PostgreSQL matrix synchronized with permissions.ts.
create or replace function public.has_organization_permission(
  target_organization_id uuid,
  required_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.profile_id = auth.uid()
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
            'assignment:read', 'assignment:create', 'assignment:update',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel',
            'replacement:read', 'replacement:create', 'replacement:cancel',
            'presence:read', 'presence:create', 'presence:update', 'presence:cancel',
            'organization_member:read', 'organization_member:update',
            'audit:read'
          ]::text[]
          when 'OPERATIONS_MANAGER' then array[
            'client:read', 'client:create', 'client:update',
            'contract:read', 'contract:create', 'contract:update',
            'operation:read', 'operation:create', 'operation:update',
            'unit:read', 'unit:create', 'unit:update',
            'job_role:read', 'job_role:create', 'job_role:update',
            'position:read', 'position:create', 'position:update',
            'worker:read',
            'assignment:read', 'assignment:create', 'assignment:update',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel',
            'replacement:read', 'replacement:create', 'replacement:cancel',
            'presence:read', 'presence:create', 'presence:update', 'presence:cancel'
          ]::text[]
          when 'SUPERVISOR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'unit:update', 'job_role:read',
            'position:read', 'position:update',
            'worker:read', 'assignment:read',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel',
            'replacement:read', 'replacement:create', 'replacement:cancel',
            'presence:read', 'presence:create', 'presence:update', 'presence:cancel'
          ]::text[]
          when 'HR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'worker:update',
            'assignment:read', 'assignment:update',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel',
            'replacement:read', 'replacement:create', 'replacement:cancel',
            'presence:read'
          ]::text[]
          when 'RECRUITER' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'assignment:read',
            'schedule:read', 'absence:read', 'replacement:read'
          ]::text[]
          when 'ADMINISTRATIVE' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'assignment:read', 'schedule:read',
            'absence:read', 'replacement:read'
          ]::text[]
          else array[]::text[]
        end
      )
  );
$$;

revoke all on function public.has_organization_permission(uuid, text) from public;
grant execute on function public.has_organization_permission(uuid, text) to authenticated;

alter table public.audit_events drop constraint audit_events_entity_type_valid;
alter table public.audit_events add constraint audit_events_entity_type_valid check (
  entity_type in (
    'client', 'contract', 'operation', 'unit', 'position', 'worker',
    'organization_member', 'assignment', 'job_role', 'schedule',
    'schedule_revision', 'schedule_entry', 'absence', 'replacement', 'presence'
  )
);

alter table public.audit_events drop constraint audit_events_action_valid;
alter table public.audit_events add constraint audit_events_action_valid check (
  action in (
    'create', 'update', 'delete', 'status_change', 'membership_change',
    'submit', 'approve', 'return_to_draft', 'publish',
    'create_from_published', 'cancel',
    'record_arrival', 'record_departure', 'correct'
  )
);

create or replace function private.validate_presence_source(
  target_source text,
  target_source_reference text
)
returns void
language plpgsql
immutable
security definer
set search_path = ''
as $$
begin
  if target_source not in ('manual', 'app', 'integration') then
    raise exception 'Invalid Presence source' using errcode = '22023';
  end if;
  if target_source in ('app', 'integration') and
     nullif(btrim(target_source_reference), '') is null then
    raise exception 'External Presence source requires source_reference'
      using errcode = '22023';
  end if;
  if target_source_reference is not null and
     char_length(btrim(target_source_reference)) not between 1 and 500 then
    raise exception 'Invalid Presence source_reference' using errcode = '22023';
  end if;
end;
$$;

create or replace function private.replay_presence_command(
  target_organization_id uuid,
  target_idempotency_key text,
  target_command text,
  target_payload jsonb
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
declare
  receipt private.presence_command_receipts;
begin
  if target_idempotency_key is null or
     char_length(btrim(target_idempotency_key)) not between 1 and 200 then
    raise exception 'Invalid Presence idempotency key' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      target_organization_id::text || ':' || target_idempotency_key,
      0
    )
  );

  select command_receipt.* into receipt
  from private.presence_command_receipts command_receipt
  where command_receipt.organization_id = target_organization_id
    and command_receipt.idempotency_key = target_idempotency_key;

  if found then
    if receipt.command <> target_command or
       receipt.request_hash <> pg_catalog.md5(target_payload::text) then
      raise exception 'Presence idempotency key was reused with a different command or payload'
        using errcode = '23505';
    end if;
    return pg_catalog.jsonb_populate_record(null::public.presences, receipt.response);
  end if;

  return null;
end;
$$;

create or replace function private.finish_presence_command(
  target_organization_id uuid,
  target_idempotency_key text,
  target_command text,
  target_payload jsonb,
  target_presence public.presences
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.presence_command_receipts (
    organization_id,
    idempotency_key,
    command,
    request_hash,
    presence_id,
    response
  ) values (
    target_organization_id,
    target_idempotency_key,
    target_command,
    pg_catalog.md5(target_payload::text),
    target_presence.id,
    to_jsonb(target_presence)
  );
end;
$$;

create or replace function private.enforce_presence_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_organization_id uuid;
  original_assignment_id uuid;
  replacement_context record;
begin
  select schedule_item.organization_id, entry.assignment_id
  into entry_organization_id, original_assignment_id
  from public.schedule_entries entry
  join public.schedule_revisions revision on revision.id = entry.schedule_revision_id
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where entry.id = new.schedule_entry_id;

  if not found then
    raise exception 'ScheduleEntry not found' using errcode = 'P0002';
  end if;
  if new.organization_id <> entry_organization_id then
    raise exception 'Presence and ScheduleEntry must belong to the same Organization'
      using errcode = '23514';
  end if;

  if new.replacement_id is null then
    if exists (
      select 1
      from public.absences absence
      where absence.schedule_entry_id = new.schedule_entry_id
        and absence.status = 'reported'
    ) then
      raise exception 'Presence without Replacement conflicts with a reported Absence'
        using errcode = '23514';
    end if;
    if new.actual_assignment_id <> original_assignment_id then
      raise exception 'Presence actual Assignment must be resolved by the database'
        using errcode = '23514';
    end if;
  else
    select replacement.organization_id,
           absence.schedule_entry_id,
           replacement.replacement_assignment_id,
           replacement.status as replacement_status,
           absence.status as absence_status
    into replacement_context
    from public.replacements replacement
    join public.absences absence on absence.id = replacement.absence_id
    where replacement.id = new.replacement_id;

    if not found or replacement_context.organization_id <> new.organization_id or
       replacement_context.schedule_entry_id <> new.schedule_entry_id or
       replacement_context.replacement_assignment_id <> new.actual_assignment_id or
       replacement_context.replacement_status <> 'active' or
       replacement_context.absence_status <> 'reported' then
      raise exception 'Presence Replacement context is invalid'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_presence_context
before insert or update of organization_id, schedule_entry_id,
  actual_assignment_id, replacement_id
on public.presences
for each row execute function private.enforce_presence_context();

create or replace function private.enforce_presence_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id or
     new.schedule_entry_id <> old.schedule_entry_id or
     new.actual_assignment_id <> old.actual_assignment_id or
     new.replacement_id is distinct from old.replacement_id or
     new.created_at <> old.created_at or
     new.created_by <> old.created_by or
     new.source <> old.source or
     new.source_reference is distinct from old.source_reference then
    raise exception 'Presence identity and origin are immutable'
      using errcode = '23514';
  end if;

  if old.status = 'cancelled' then
    raise exception 'Cancelled Presence is immutable' using errcode = '23514';
  end if;
  if old.status = 'completed' and new.status = 'present' then
    raise exception 'Completed Presence cannot return to present'
      using errcode = '23514';
  end if;
  if new.status not in (old.status, 'completed', 'cancelled') then
    raise exception 'Invalid Presence lifecycle transition'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger enforce_presence_history
before update on public.presences
for each row execute function private.enforce_presence_history();

create or replace function private.start_presence(
  target_organization_id uuid,
  target_schedule_entry_id uuid,
  target_arrived_at timestamptz,
  target_source text,
  target_source_reference text,
  target_idempotency_key text
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  entry_context record;
  active_absence_id uuid;
  active_replacement record;
  resolved_assignment_id uuid;
  resolved_replacement_id uuid;
  payload jsonb;
  replayed public.presences;
  item public.presences;
begin
  perform private.validate_presence_source(target_source, target_source_reference);
  if target_arrived_at is null then
    raise exception 'Presence arrived_at is required' using errcode = '23514';
  end if;

  payload := jsonb_build_object(
    'schedule_entry_id', target_schedule_entry_id,
    'arrived_at', target_arrived_at,
    'source', target_source,
    'source_reference', target_source_reference
  );
  replayed := private.replay_presence_command(
    target_organization_id,
    target_idempotency_key,
    'create',
    payload
  );
  if replayed.id is not null then
    return replayed;
  end if;

  select schedule_item.organization_id,
         entry.assignment_id,
         revision.status,
         revision.version,
         revision.schedule_id
  into entry_context
  from public.schedule_entries entry
  join public.schedule_revisions revision on revision.id = entry.schedule_revision_id
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where entry.id = target_schedule_entry_id
  for update of entry;

  if not found then
    raise exception 'ScheduleEntry not found' using errcode = 'P0002';
  end if;
  if entry_context.organization_id <> target_organization_id then
    raise exception 'Presence belongs to another Organization' using errcode = '23514';
  end if;
  if entry_context.status <> 'published' or entry_context.version <> (
    select max(revision.version)
    from public.schedule_revisions revision
    where revision.schedule_id = entry_context.schedule_id
      and revision.status = 'published'
  ) then
    raise exception 'Presence can only start for the current published ScheduleEntry'
      using errcode = '23514';
  end if;

  select absence.id into active_absence_id
  from public.absences absence
  where absence.schedule_entry_id = target_schedule_entry_id
    and absence.status = 'reported'
  for update;

  if found then
    select replacement.id, replacement.replacement_assignment_id
    into active_replacement
    from public.replacements replacement
    where replacement.absence_id = active_absence_id
      and replacement.status = 'active'
    for update;

    if not found then
      raise exception 'Presence cannot start for an uncovered Absence'
        using errcode = '23514';
    end if;
    resolved_assignment_id := active_replacement.replacement_assignment_id;
    resolved_replacement_id := active_replacement.id;
  else
    resolved_assignment_id := entry_context.assignment_id;
    resolved_replacement_id := null;
  end if;

  insert into public.presences (
    organization_id,
    schedule_entry_id,
    actual_assignment_id,
    replacement_id,
    arrived_at,
    source,
    source_reference,
    created_by
  ) values (
    target_organization_id,
    target_schedule_entry_id,
    resolved_assignment_id,
    resolved_replacement_id,
    target_arrived_at,
    target_source,
    nullif(btrim(target_source_reference), ''),
    actor_id
  ) returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    item.organization_id,
    actor_id,
    'presence',
    item.id,
    'record_arrival',
    jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', to_jsonb(item),
      'changes', jsonb_build_array(
        'schedule_entry_id', 'actual_assignment_id', 'replacement_id',
        'status', 'arrived_at', 'source', 'source_reference'
      ),
      'command_source', target_source,
      'command_source_reference', target_source_reference
    )
  );

  perform private.finish_presence_command(
    target_organization_id,
    target_idempotency_key,
    'create',
    payload,
    item
  );
  return item;
end;
$$;

create or replace function public.start_presence(
  organization_id uuid,
  schedule_entry_id uuid,
  arrived_at timestamptz,
  idempotency_key text,
  source text default 'manual',
  source_reference text default null
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_organization_permission(
    start_presence.organization_id,
    'presence:create'
  );
  return private.start_presence(
    start_presence.organization_id,
    start_presence.schedule_entry_id,
    start_presence.arrived_at,
    start_presence.source,
    start_presence.source_reference,
    start_presence.idempotency_key
  );
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
begin
  perform private.validate_presence_source(target_source, target_source_reference);
  payload := jsonb_build_object(
    'presence_id', target_presence_id,
    'departed_at', target_departed_at,
    'source', target_source,
    'source_reference', target_source_reference
  );
  replayed := private.replay_presence_command(
    target_organization_id,
    target_idempotency_key,
    'complete',
    payload
  );
  if replayed.id is not null then
    return replayed;
  end if;

  select presence.* into old_item
  from public.presences presence
  where presence.id = target_presence_id
  for update;

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

  if old_item.status = 'completed' and old_item.departed_at = target_departed_at then
    perform private.finish_presence_command(
      target_organization_id,
      target_idempotency_key,
      'complete',
      payload,
      old_item
    );
    return old_item;
  end if;
  if old_item.status <> 'present' then
    raise exception 'Only a present Presence can be completed'
      using errcode = '23514';
  end if;

  update public.presences
  set status = 'completed',
      departed_at = target_departed_at,
      completed_at = now(),
      completed_by = actor_id
  where id = target_presence_id
  returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    item.organization_id,
    actor_id,
    'presence',
    item.id,
    'record_departure',
    public.build_audit_metadata(
      to_jsonb(old_item),
      to_jsonb(item),
      array['status', 'departed_at', 'completed_at', 'completed_by']::text[]
    ) || jsonb_build_object(
      'command_source', target_source,
      'command_source_reference', target_source_reference
    )
  );

  perform private.finish_presence_command(
    target_organization_id,
    target_idempotency_key,
    'complete',
    payload,
    item
  );
  return item;
end;
$$;

create or replace function public.complete_presence(
  organization_id uuid,
  presence_id uuid,
  departed_at timestamptz,
  idempotency_key text,
  source text default 'manual',
  source_reference text default null
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_organization_permission(
    complete_presence.organization_id,
    'presence:update'
  );
  return private.complete_presence(
    complete_presence.organization_id,
    complete_presence.presence_id,
    complete_presence.departed_at,
    complete_presence.source,
    complete_presence.source_reference,
    complete_presence.idempotency_key
  );
end;
$$;

create or replace function private.correct_presence(
  target_organization_id uuid,
  target_presence_id uuid,
  target_arrived_at timestamptz,
  target_departed_at timestamptz,
  target_reason text,
  target_source text,
  target_source_reference text,
  target_idempotency_key text
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
begin
  perform private.validate_presence_source(target_source, target_source_reference);
  if nullif(btrim(target_reason), '') is null or
     char_length(btrim(target_reason)) > 1000 then
    raise exception 'Presence correction requires a valid reason'
      using errcode = '22023';
  end if;
  if target_arrived_at is null or
     (target_departed_at is not null and target_departed_at <= target_arrived_at) then
    raise exception 'Invalid Presence correction interval' using errcode = '23514';
  end if;

  payload := jsonb_build_object(
    'presence_id', target_presence_id,
    'arrived_at', target_arrived_at,
    'departed_at', target_departed_at,
    'reason', btrim(target_reason),
    'source', target_source,
    'source_reference', target_source_reference
  );
  replayed := private.replay_presence_command(
    target_organization_id,
    target_idempotency_key,
    'correct',
    payload
  );
  if replayed.id is not null then
    return replayed;
  end if;

  select presence.* into old_item
  from public.presences presence
  where presence.id = target_presence_id
  for update;

  if not found then
    raise exception 'Presence not found' using errcode = 'P0002';
  end if;
  if old_item.organization_id <> target_organization_id then
    raise exception 'Presence belongs to another Organization' using errcode = '23514';
  end if;
  if old_item.status = 'cancelled' then
    raise exception 'Cancelled Presence cannot be corrected' using errcode = '23514';
  end if;
  if old_item.status = 'present' and target_departed_at is not null then
    raise exception 'A present Presence cannot receive departed_at through correction'
      using errcode = '23514';
  end if;
  if old_item.status = 'completed' and target_departed_at is null then
    raise exception 'A completed Presence requires departed_at'
      using errcode = '23514';
  end if;

  if old_item.arrived_at = target_arrived_at and
     old_item.departed_at is not distinct from target_departed_at then
    perform private.finish_presence_command(
      target_organization_id,
      target_idempotency_key,
      'correct',
      payload,
      old_item
    );
    return old_item;
  end if;

  update public.presences
  set arrived_at = target_arrived_at,
      departed_at = target_departed_at,
      corrected_at = now(),
      corrected_by = actor_id,
      correction_reason = btrim(target_reason)
  where id = target_presence_id
  returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    item.organization_id,
    actor_id,
    'presence',
    item.id,
    'correct',
    public.build_audit_metadata(
      to_jsonb(old_item),
      to_jsonb(item),
      array[
        'arrived_at', 'departed_at', 'corrected_at',
        'corrected_by', 'correction_reason'
      ]::text[]
    ) || jsonb_build_object(
      'reason', btrim(target_reason),
      'command_source', target_source,
      'command_source_reference', target_source_reference
    )
  );

  perform private.finish_presence_command(
    target_organization_id,
    target_idempotency_key,
    'correct',
    payload,
    item
  );
  return item;
end;
$$;

create or replace function public.correct_presence(
  organization_id uuid,
  presence_id uuid,
  arrived_at timestamptz,
  departed_at timestamptz,
  reason text,
  idempotency_key text,
  source text default 'manual',
  source_reference text default null
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_organization_permission(
    correct_presence.organization_id,
    'presence:update'
  );
  return private.correct_presence(
    correct_presence.organization_id,
    correct_presence.presence_id,
    correct_presence.arrived_at,
    correct_presence.departed_at,
    correct_presence.reason,
    correct_presence.source,
    correct_presence.source_reference,
    correct_presence.idempotency_key
  );
end;
$$;

create or replace function private.cancel_presence(
  target_organization_id uuid,
  target_presence_id uuid,
  target_reason text,
  target_source text,
  target_source_reference text,
  target_idempotency_key text
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
begin
  perform private.validate_presence_source(target_source, target_source_reference);
  if nullif(btrim(target_reason), '') is null or
     char_length(btrim(target_reason)) > 1000 then
    raise exception 'Presence cancellation requires a valid reason'
      using errcode = '22023';
  end if;

  payload := jsonb_build_object(
    'presence_id', target_presence_id,
    'reason', btrim(target_reason),
    'source', target_source,
    'source_reference', target_source_reference
  );
  replayed := private.replay_presence_command(
    target_organization_id,
    target_idempotency_key,
    'cancel',
    payload
  );
  if replayed.id is not null then
    return replayed;
  end if;

  select presence.* into old_item
  from public.presences presence
  where presence.id = target_presence_id
  for update;

  if not found then
    raise exception 'Presence not found' using errcode = 'P0002';
  end if;
  if old_item.organization_id <> target_organization_id then
    raise exception 'Presence belongs to another Organization' using errcode = '23514';
  end if;
  if old_item.status = 'cancelled' then
    raise exception 'Presence is already cancelled' using errcode = '23514';
  end if;

  update public.presences
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = actor_id,
      cancellation_reason = btrim(target_reason)
  where id = target_presence_id
  returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    item.organization_id,
    actor_id,
    'presence',
    item.id,
    'cancel',
    public.build_audit_metadata(
      to_jsonb(old_item),
      to_jsonb(item),
      array['status', 'cancelled_at', 'cancelled_by', 'cancellation_reason']::text[]
    ) || jsonb_build_object(
      'reason', btrim(target_reason),
      'command_source', target_source,
      'command_source_reference', target_source_reference
    )
  );

  perform private.finish_presence_command(
    target_organization_id,
    target_idempotency_key,
    'cancel',
    payload,
    item
  );
  return item;
end;
$$;

create or replace function public.cancel_presence(
  organization_id uuid,
  presence_id uuid,
  reason text,
  idempotency_key text,
  source text default 'manual',
  source_reference text default null
)
returns public.presences
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_organization_permission(
    cancel_presence.organization_id,
    'presence:cancel'
  );
  return private.cancel_presence(
    cancel_presence.organization_id,
    cancel_presence.presence_id,
    cancel_presence.reason,
    cancel_presence.source,
    cancel_presence.source_reference,
    cancel_presence.idempotency_key
  );
end;
$$;

-- Absence creation and Replacement cancellation must serialize with Presence.
create or replace function private.prevent_absence_after_presence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'reported' then
    perform 1
    from public.schedule_entries entry
    where entry.id = new.schedule_entry_id
    for update;

    if exists (
      select 1
      from public.presences presence
      where presence.schedule_entry_id = new.schedule_entry_id
        and presence.status in ('present', 'completed')
    ) then
      raise exception 'Absence cannot be reported after a valid Presence exists'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger prevent_absence_after_presence
before insert or update of status, schedule_entry_id on public.absences
for each row execute function private.prevent_absence_after_presence();

create or replace function private.prevent_replacement_cancellation_after_presence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'active' and new.status = 'cancelled' and exists (
    select 1
    from public.presences presence
    where presence.replacement_id = old.id
      and presence.status in ('present', 'completed')
  ) then
    raise exception 'Replacement cannot be cancelled while referenced by a valid Presence'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger prevent_replacement_cancellation_after_presence
before update of status on public.replacements
for each row execute function private.prevent_replacement_cancellation_after_presence();

create or replace function private.create_absence(
  target_organization_id uuid,
  target_schedule_entry_id uuid,
  target_reason text,
  target_notes text
)
returns public.absences
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  item public.absences;
begin
  perform 1
  from public.schedule_entries entry
  where entry.id = target_schedule_entry_id
  for update;
  if not found then
    raise exception 'ScheduleEntry not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.schedule_entries entry
    join public.schedule_revisions revision on revision.id = entry.schedule_revision_id
    where entry.id = target_schedule_entry_id
      and revision.status = 'published'
      and revision.version = (
        select max(published_revision.version)
        from public.schedule_revisions published_revision
        where published_revision.schedule_id = revision.schedule_id
          and published_revision.status = 'published'
      )
  ) then
    raise exception 'Absence can only be reported for the current published ScheduleEntry'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.presences presence
    where presence.schedule_entry_id = target_schedule_entry_id
      and presence.status in ('present', 'completed')
  ) then
    raise exception 'Absence cannot be reported after a valid Presence exists'
      using errcode = '23514';
  end if;

  insert into public.absences (
    organization_id, schedule_entry_id, reason, notes, reported_by
  ) values (
    target_organization_id,
    target_schedule_entry_id,
    target_reason,
    nullif(btrim(target_notes), ''),
    actor_id
  ) returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    item.organization_id,
    actor_id,
    'absence',
    item.id,
    'create',
    jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', to_jsonb(item),
      'changes', jsonb_build_array('schedule_entry_id', 'reason', 'notes', 'status')
    )
  );
  return item;
end;
$$;

create or replace function private.cancel_replacement(rid uuid)
returns public.replacements
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  old_item public.replacements;
  item public.replacements;
begin
  select replacement.* into old_item
  from public.replacements replacement
  where replacement.id = rid
  for update;

  if not found then
    raise exception 'Replacement not found' using errcode = 'P0002';
  end if;
  if old_item.status <> 'active' then
    raise exception 'Only an active Replacement can be cancelled'
      using errcode = '23514';
  end if;
  if exists (
    select 1
    from public.presences presence
    where presence.replacement_id = old_item.id
      and presence.status in ('present', 'completed')
  ) then
    raise exception 'Replacement cannot be cancelled while referenced by a valid Presence'
      using errcode = '23514';
  end if;

  update public.replacements
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = actor_id
  where id = rid
  returning * into item;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    item.organization_id,
    actor_id,
    'replacement',
    item.id,
    'cancel',
    public.build_audit_metadata(
      to_jsonb(old_item),
      to_jsonb(item),
      array['status', 'cancelled_at', 'cancelled_by']::text[],
      array['status', 'cancelled_at', 'cancelled_by']::text[]
    )
  );
  return item;
end;
$$;

revoke all on function private.validate_presence_source(text, text)
  from public, anon, authenticated;
revoke all on function private.replay_presence_command(uuid, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function private.finish_presence_command(uuid, text, text, jsonb, public.presences)
  from public, anon, authenticated;
revoke all on function private.enforce_presence_context()
  from public, anon, authenticated;
revoke all on function private.enforce_presence_history()
  from public, anon, authenticated;
revoke all on function private.start_presence(uuid, uuid, timestamptz, text, text, text)
  from public, anon, authenticated;
revoke all on function private.complete_presence(uuid, uuid, timestamptz, text, text, text)
  from public, anon, authenticated;
revoke all on function private.correct_presence(uuid, uuid, timestamptz, timestamptz, text, text, text, text)
  from public, anon, authenticated;
revoke all on function private.cancel_presence(uuid, uuid, text, text, text, text)
  from public, anon, authenticated;
revoke all on function private.prevent_absence_after_presence()
  from public, anon, authenticated;
revoke all on function private.prevent_replacement_cancellation_after_presence()
  from public, anon, authenticated;
revoke all on function private.create_absence(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function private.cancel_replacement(uuid)
  from public, anon, authenticated;

revoke all on function public.start_presence(uuid, uuid, timestamptz, text, text, text)
  from public, anon;
revoke all on function public.complete_presence(uuid, uuid, timestamptz, text, text, text)
  from public, anon;
revoke all on function public.correct_presence(uuid, uuid, timestamptz, timestamptz, text, text, text, text)
  from public, anon;
revoke all on function public.cancel_presence(uuid, uuid, text, text, text, text)
  from public, anon;

grant execute on function public.start_presence(uuid, uuid, timestamptz, text, text, text)
  to authenticated;
grant execute on function public.complete_presence(uuid, uuid, timestamptz, text, text, text)
  to authenticated;
grant execute on function public.correct_presence(uuid, uuid, timestamptz, timestamptz, text, text, text, text)
  to authenticated;
grant execute on function public.cancel_presence(uuid, uuid, text, text, text, text)
  to authenticated;

comment on table public.presences is
  'Audited operational realization of one published ScheduleEntry by the authoritative actual Assignment.';
comment on table private.presence_command_receipts is
  'Minimal transaction-local idempotency receipts for Presence commands; not an attendance event ledger.';
