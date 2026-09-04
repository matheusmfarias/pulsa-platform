-- Phase 4A.1 Scheduling Domain Foundation.
-- Scheduling is concrete planned work anchored to an Assignment. Published
-- history is append-only and protected independently from future Attendance or
-- temporal staffing requirements.

create extension if not exists btree_gist with schema extensions;

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  operation_id uuid not null references public.operations(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  constraint schedules_period_valid check (period_start <= period_end),
  constraint schedules_operation_period_exclusion exclude using gist (
    operation_id with =,
    daterange(period_start, period_end, '[]') with &&
  )
);

create table public.schedule_revisions (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete restrict,
  version integer not null,
  status text not null default 'draft',
  based_on_revision_id uuid,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  submitted_at timestamptz,
  submitted_by uuid references public.profiles(id) on delete restrict,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete restrict,
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete restrict,
  constraint schedule_revisions_version_positive check (version > 0),
  constraint schedule_revisions_status_valid check (
    status in ('draft', 'pending_approval', 'approved', 'published')
  ),
  constraint schedule_revisions_schedule_version_unique unique (schedule_id, version),
  constraint schedule_revisions_schedule_id_pair_unique unique (schedule_id, id),
  constraint schedule_revisions_based_on_not_self check (
    based_on_revision_id is null or based_on_revision_id <> id
  ),
  constraint schedule_revisions_based_on_same_schedule_fkey
    foreign key (schedule_id, based_on_revision_id)
    references public.schedule_revisions(schedule_id, id)
    on delete restrict,
  constraint schedule_revisions_lifecycle_metadata_valid check (
    (
      status = 'draft'
      and submitted_at is null and submitted_by is null
      and approved_at is null and approved_by is null
      and published_at is null and published_by is null
    ) or (
      status = 'pending_approval'
      and submitted_at is not null and submitted_by is not null
      and approved_at is null and approved_by is null
      and published_at is null and published_by is null
    ) or (
      status = 'approved'
      and submitted_at is not null and submitted_by is not null
      and approved_at is not null and approved_by is not null
      and published_at is null and published_by is null
    ) or (
      status = 'published'
      and submitted_at is not null and submitted_by is not null
      and approved_at is not null and approved_by is not null
      and published_at is not null and published_by is not null
    )
  )
);

create table public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  schedule_revision_id uuid not null
    references public.schedule_revisions(id) on delete restrict,
  assignment_id uuid not null references public.assignments(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  break_starts_at timestamptz,
  break_ends_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  constraint schedule_entries_period_valid check (starts_at < ends_at),
  constraint schedule_entries_break_pair_valid check (
    (break_starts_at is null and break_ends_at is null)
    or (break_starts_at is not null and break_ends_at is not null)
  ),
  constraint schedule_entries_break_period_valid check (
    break_starts_at is null
    or (
      starts_at < break_starts_at
      and break_starts_at < break_ends_at
      and break_ends_at < ends_at
    )
  )
);

create index schedules_operation_period_idx
  on public.schedules (operation_id, period_start, period_end);
create index schedules_organization_id_idx
  on public.schedules (organization_id);
create index schedule_revisions_status_idx
  on public.schedule_revisions (status);
create index schedule_revisions_current_published_idx
  on public.schedule_revisions (schedule_id, version desc)
  where status = 'published';
create index schedule_entries_revision_id_idx
  on public.schedule_entries (schedule_revision_id);
create index schedule_entries_assignment_id_idx
  on public.schedule_entries (assignment_id);
create index schedule_entries_assignment_interval_idx
  on public.schedule_entries (assignment_id, starts_at, ends_at);
create index schedule_entries_interval_gist_idx
  on public.schedule_entries using gist (tstzrange(starts_at, ends_at, '[)'));

alter table public.schedules enable row level security;
alter table public.schedule_revisions enable row level security;
alter table public.schedule_entries enable row level security;

create policy "Members with schedule read can read schedules"
on public.schedules for select to authenticated
using (
  public.has_organization_permission(organization_id, 'schedule:read')
);

create policy "Members with schedule read can read schedule revisions"
on public.schedule_revisions for select to authenticated
using (
  exists (
    select 1
    from public.schedules schedule_item
    where schedule_item.id = schedule_revisions.schedule_id
      and public.has_organization_permission(
        schedule_item.organization_id,
        'schedule:read'
      )
  )
);

create policy "Members with schedule read can read schedule entries"
on public.schedule_entries for select to authenticated
using (
  exists (
    select 1
    from public.schedule_revisions revision
    join public.schedules schedule_item on schedule_item.id = revision.schedule_id
    where revision.id = schedule_entries.schedule_revision_id
      and public.has_organization_permission(
        schedule_item.organization_id,
        'schedule:read'
      )
  )
);

revoke all on table public.schedules from anon, authenticated;
revoke all on table public.schedule_revisions from anon, authenticated;
revoke all on table public.schedule_entries from anon, authenticated;
grant select on table public.schedules to authenticated;
grant select on table public.schedule_revisions to authenticated;
grant select on table public.schedule_entries to authenticated;

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
            'schedule:submit', 'schedule:approve', 'schedule:publish'
          ]::text[]
          when 'SUPERVISOR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'unit:update', 'job_role:read',
            'position:read', 'position:update',
            'worker:read', 'assignment:read',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish'
          ]::text[]
          when 'HR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'worker:update',
            'assignment:read', 'assignment:update',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish'
          ]::text[]
          when 'RECRUITER' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'assignment:read',
            'schedule:read'
          ]::text[]
          when 'ADMINISTRATIVE' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'assignment:read', 'schedule:read'
          ]::text[]
          else array[]::text[]
        end
      )
  );
$$;

revoke all on function public.has_organization_permission(uuid, text) from public;
grant execute on function public.has_organization_permission(uuid, text) to authenticated;

create or replace function private.enforce_schedule_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  operation_organization_id uuid;
begin
  select client.organization_id into operation_organization_id
  from public.operations operation_item
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  where operation_item.id = new.operation_id;

  if operation_organization_id is null then
    raise exception 'Operation not found' using errcode = '23503';
  end if;
  if operation_organization_id <> new.organization_id then
    raise exception 'Schedule and Operation must belong to the same Organization'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger enforce_schedule_organization
before insert or update on public.schedules
for each row execute function private.enforce_schedule_organization();

create or replace function private.enforce_schedule_revision_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'published' then
      raise exception 'Published ScheduleRevision is immutable'
        using errcode = '23514';
    end if;
    return old;
  end if;

  if old.status = 'published' then
    raise exception 'Published ScheduleRevision is immutable'
      using errcode = '23514';
  end if;

  if new.schedule_id is distinct from old.schedule_id
    or new.version is distinct from old.version
    or new.based_on_revision_id is distinct from old.based_on_revision_id
    or new.created_at is distinct from old.created_at
    or new.created_by is distinct from old.created_by then
    raise exception 'ScheduleRevision identity and origin are immutable'
      using errcode = '23514';
  end if;

  if not (
    (old.status = 'draft' and new.status = 'pending_approval')
    or (old.status = 'pending_approval' and new.status in ('approved', 'draft'))
    or (old.status = 'approved' and new.status in ('published', 'draft'))
  ) then
    raise exception 'Invalid ScheduleRevision status transition'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger enforce_schedule_revision_lifecycle
before update or delete on public.schedule_revisions
for each row execute function private.enforce_schedule_revision_lifecycle();

create or replace function private.validate_schedule_entry_values(
  target_revision_id uuid,
  target_assignment_id uuid,
  target_starts_at timestamptz,
  target_ends_at timestamptz,
  target_break_starts_at timestamptz,
  target_break_ends_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  revision_status text;
  schedule_organization_id uuid;
  schedule_operation_id uuid;
  schedule_period_start date;
  schedule_period_end date;
  assignment_status text;
  assignment_start_date date;
  assignment_end_date date;
  assignment_operation_id uuid;
  worker_organization_id uuid;
  worker_start_date date;
  worker_end_date date;
  operation_start_date date;
  operation_end_date date;
  contract_start_date date;
  contract_end_date date;
  unit_timezone text;
  entry_start_date date;
  entry_end_date date;
begin
  if target_starts_at is null or target_ends_at is null
    or target_starts_at >= target_ends_at then
    raise exception 'ScheduleEntry requires starts_at before ends_at'
      using errcode = '23514';
  end if;

  if not (
    (target_break_starts_at is null and target_break_ends_at is null)
    or (
      target_break_starts_at is not null
      and target_break_ends_at is not null
      and target_starts_at < target_break_starts_at
      and target_break_starts_at < target_break_ends_at
      and target_break_ends_at < target_ends_at
    )
  ) then
    raise exception 'ScheduleEntry break must be null or strictly inside the entry'
      using errcode = '23514';
  end if;

  select
    revision.status,
    schedule_item.organization_id,
    schedule_item.operation_id,
    schedule_item.period_start,
    schedule_item.period_end
  into
    revision_status,
    schedule_organization_id,
    schedule_operation_id,
    schedule_period_start,
    schedule_period_end
  from public.schedule_revisions revision
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where revision.id = target_revision_id;

  if revision_status is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;
  select
    assignment_item.status,
    assignment_item.start_date,
    assignment_item.end_date,
    unit.operation_id,
    unit.timezone,
    worker.organization_id,
    worker.engagement_start_date,
    worker.engagement_end_date,
    operation_item.start_date,
    operation_item.end_date,
    contract.start_date,
    contract.end_date
  into
    assignment_status,
    assignment_start_date,
    assignment_end_date,
    assignment_operation_id,
    unit_timezone,
    worker_organization_id,
    worker_start_date,
    worker_end_date,
    operation_start_date,
    operation_end_date,
    contract_start_date,
    contract_end_date
  from public.assignments assignment_item
  join public.workers worker on worker.id = assignment_item.worker_id
  join public.positions position on position.id = assignment_item.position_id
  join public.units unit on unit.id = position.unit_id
  join public.operations operation_item on operation_item.id = unit.operation_id
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  where assignment_item.id = target_assignment_id
    and worker.organization_id = client.organization_id
  for share of assignment_item, worker, operation_item, contract;

  if assignment_status is null then
    raise exception 'Assignment not found or structurally incoherent'
      using errcode = '23503';
  end if;
  if worker_organization_id <> schedule_organization_id then
    raise exception 'Assignment and Schedule must belong to the same Organization'
      using errcode = '23514';
  end if;
  if assignment_operation_id <> schedule_operation_id then
    raise exception 'Assignment and Schedule must belong to the same Operation'
      using errcode = '23514';
  end if;
  if assignment_status not in ('pending', 'active') then
    raise exception 'Assignment status is not eligible for Scheduling'
      using errcode = '23514';
  end if;

  entry_start_date := (target_starts_at at time zone unit_timezone)::date;
  entry_end_date := (
    (target_ends_at - interval '1 microsecond') at time zone unit_timezone
  )::date;

  if entry_start_date < schedule_period_start
    or entry_end_date > schedule_period_end then
    raise exception 'ScheduleEntry is outside the Schedule civil period'
      using errcode = '23514';
  end if;
  if entry_start_date < assignment_start_date
    or (assignment_end_date is not null and entry_end_date > assignment_end_date) then
    raise exception 'ScheduleEntry is outside the Assignment validity'
      using errcode = '23514';
  end if;
  if entry_start_date < operation_start_date
    or (operation_end_date is not null and entry_end_date > operation_end_date) then
    raise exception 'ScheduleEntry is outside the Operation validity'
      using errcode = '23514';
  end if;
  if entry_start_date < contract_start_date
    or (contract_end_date is not null and entry_end_date > contract_end_date) then
    raise exception 'ScheduleEntry is outside the Contract validity'
      using errcode = '23514';
  end if;
  if worker_start_date is not null and entry_start_date < worker_start_date then
    raise exception 'ScheduleEntry is outside the Worker engagement validity'
      using errcode = '23514';
  end if;
  if worker_end_date is not null and entry_end_date > worker_end_date then
    raise exception 'ScheduleEntry is outside the Worker engagement validity'
      using errcode = '23514';
  end if;
end;
$$;

create or replace function private.enforce_schedule_entry_editability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_status text;
begin
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

create trigger enforce_schedule_entry_editability
before insert or update or delete on public.schedule_entries
for each row execute function private.enforce_schedule_entry_editability();

create or replace function private.assert_no_schedule_worker_conflicts(
  target_revision_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_schedule_id uuid;
  target_organization_id uuid;
begin
  select revision.schedule_id, schedule_item.organization_id
    into target_schedule_id, target_organization_id
  from public.schedule_revisions revision
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where revision.id = target_revision_id;

  if target_schedule_id is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.schedule_entries first_entry
    join public.assignments first_assignment
      on first_assignment.id = first_entry.assignment_id
    join public.schedule_entries second_entry
      on second_entry.schedule_revision_id = first_entry.schedule_revision_id
      and second_entry.id > first_entry.id
    join public.assignments second_assignment
      on second_assignment.id = second_entry.assignment_id
      and second_assignment.worker_id = first_assignment.worker_id
    where first_entry.schedule_revision_id = target_revision_id
      and tstzrange(first_entry.starts_at, first_entry.ends_at, '[)')
        && tstzrange(second_entry.starts_at, second_entry.ends_at, '[)')
  ) then
    raise exception 'Worker has overlapping entries in the ScheduleRevision'
      using errcode = '23P01';
  end if;

  if exists (
    select 1
    from public.schedule_entries candidate_entry
    join public.assignments candidate_assignment
      on candidate_assignment.id = candidate_entry.assignment_id
    join public.assignments external_assignment
      on external_assignment.worker_id = candidate_assignment.worker_id
    join public.schedule_entries external_entry
      on external_entry.assignment_id = external_assignment.id
    join public.schedule_revisions external_revision
      on external_revision.id = external_entry.schedule_revision_id
    join public.schedules external_schedule
      on external_schedule.id = external_revision.schedule_id
    where candidate_entry.schedule_revision_id = target_revision_id
      and external_schedule.organization_id = target_organization_id
      and external_schedule.id <> target_schedule_id
      and (
        external_revision.status in ('pending_approval', 'approved')
        or (
          external_revision.status = 'published'
          and external_revision.version = (
            select max(current_revision.version)
            from public.schedule_revisions current_revision
            where current_revision.schedule_id = external_revision.schedule_id
              and current_revision.status = 'published'
          )
        )
      )
      and tstzrange(candidate_entry.starts_at, candidate_entry.ends_at, '[)')
        && tstzrange(external_entry.starts_at, external_entry.ends_at, '[)')
  ) then
    raise exception 'Worker has overlapping entries in another relevant ScheduleRevision'
      using errcode = '23P01';
  end if;
end;
$$;

create or replace function private.validate_schedule_revision(
  target_revision_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_item public.schedule_entries;
begin
  for entry_item in
    select entry.*
    from public.schedule_entries entry
    where entry.schedule_revision_id = target_revision_id
  loop
    perform private.validate_schedule_entry_values(
      entry_item.schedule_revision_id,
      entry_item.assignment_id,
      entry_item.starts_at,
      entry_item.ends_at,
      entry_item.break_starts_at,
      entry_item.break_ends_at
    );
  end loop;

  perform private.assert_no_schedule_worker_conflicts(target_revision_id);
end;
$$;

alter table public.audit_events drop constraint audit_events_entity_type_valid;
alter table public.audit_events add constraint audit_events_entity_type_valid check (
  entity_type in (
    'client', 'contract', 'operation', 'unit', 'position', 'worker',
    'organization_member', 'assignment', 'job_role', 'schedule',
    'schedule_revision', 'schedule_entry'
  )
);

alter table public.audit_events drop constraint audit_events_action_valid;
alter table public.audit_events add constraint audit_events_action_valid check (
  action in (
    'create', 'update', 'delete', 'status_change', 'membership_change',
    'submit', 'approve', 'return_to_draft', 'publish',
    'create_from_published'
  )
);

create or replace function private.schedule_revision_organization_id(
  target_revision_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select schedule_item.organization_id
  from public.schedule_revisions revision
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where revision.id = target_revision_id;
$$;

create or replace function private.create_schedule(
  target_organization_id uuid,
  target_operation_id uuid,
  target_period_start date,
  target_period_end date
)
returns public.schedules
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  new_schedule public.schedules;
  new_revision public.schedule_revisions;
begin
  insert into public.schedules (
    organization_id, operation_id, period_start, period_end, created_by
  ) values (
    target_organization_id,
    target_operation_id,
    target_period_start,
    target_period_end,
    actor_id
  ) returning * into new_schedule;

  insert into public.schedule_revisions (
    schedule_id, version, status, created_by
  ) values (
    new_schedule.id, 1, 'draft', actor_id
  ) returning * into new_revision;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values
  (
    new_schedule.organization_id,
    actor_id,
    'schedule',
    new_schedule.id,
    'create',
    jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object(
        'operation_id', new_schedule.operation_id,
        'period_start', new_schedule.period_start,
        'period_end', new_schedule.period_end
      ),
      'changes', jsonb_build_array(
        'operation_id', 'period_start', 'period_end'
      )
    )
  ),
  (
    new_schedule.organization_id,
    actor_id,
    'schedule_revision',
    new_revision.id,
    'create',
    jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object(
        'schedule_id', new_revision.schedule_id,
        'version', new_revision.version,
        'status', new_revision.status
      ),
      'changes', jsonb_build_array('schedule_id', 'version', 'status')
    )
  );

  return new_schedule;
end;
$$;

create or replace function public.create_schedule(
  organization_id uuid,
  operation_id uuid,
  period_start date,
  period_end date
)
returns public.schedules
language plpgsql
security definer
set search_path = ''
as $$
declare
  operation_organization_id uuid;
begin
  select client.organization_id into operation_organization_id
  from public.operations operation_item
  join public.contracts contract on contract.id = operation_item.contract_id
  join public.clients client on client.id = contract.client_id
  where operation_item.id = create_schedule.operation_id;

  if operation_organization_id is null then
    raise exception 'Operation not found' using errcode = 'P0002';
  end if;
  if operation_organization_id <> create_schedule.organization_id then
    raise exception 'Schedule and Operation must belong to the same Organization'
      using errcode = '23514';
  end if;

  perform private.require_organization_permission(
    create_schedule.organization_id,
    'schedule:create'
  );
  return private.create_schedule(
    create_schedule.organization_id,
    create_schedule.operation_id,
    create_schedule.period_start,
    create_schedule.period_end
  );
end;
$$;

create or replace function private.create_schedule_entry(
  target_revision_id uuid,
  target_assignment_id uuid,
  target_starts_at timestamptz,
  target_ends_at timestamptz,
  target_break_starts_at timestamptz,
  target_break_ends_at timestamptz
)
returns public.schedule_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  organization_id uuid;
  new_entry public.schedule_entries;
begin
  organization_id := private.schedule_revision_organization_id(target_revision_id);

  insert into public.schedule_entries (
    schedule_revision_id,
    assignment_id,
    starts_at,
    ends_at,
    break_starts_at,
    break_ends_at,
    created_by
  ) values (
    target_revision_id,
    target_assignment_id,
    target_starts_at,
    target_ends_at,
    target_break_starts_at,
    target_break_ends_at,
    actor_id
  ) returning * into new_entry;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    organization_id,
    actor_id,
    'schedule_entry',
    new_entry.id,
    'create',
    jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object(
        'schedule_revision_id', new_entry.schedule_revision_id,
        'assignment_id', new_entry.assignment_id,
        'starts_at', new_entry.starts_at,
        'ends_at', new_entry.ends_at
      ),
      'changes', jsonb_build_array(
        'schedule_revision_id', 'assignment_id', 'starts_at', 'ends_at',
        'break_starts_at', 'break_ends_at'
      )
    )
  );
  return new_entry;
end;
$$;

create or replace function public.create_schedule_entry(
  schedule_revision_id uuid,
  assignment_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  break_starts_at timestamptz default null,
  break_ends_at timestamptz default null
)
returns public.schedule_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_id uuid;
begin
  organization_id := private.schedule_revision_organization_id(
    create_schedule_entry.schedule_revision_id
  );
  if organization_id is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;
  perform private.require_organization_permission(organization_id, 'schedule:update');
  return private.create_schedule_entry(
    create_schedule_entry.schedule_revision_id,
    create_schedule_entry.assignment_id,
    create_schedule_entry.starts_at,
    create_schedule_entry.ends_at,
    create_schedule_entry.break_starts_at,
    create_schedule_entry.break_ends_at
  );
end;
$$;

create or replace function private.update_schedule_entry(
  target_entry_id uuid,
  target_assignment_id uuid,
  target_starts_at timestamptz,
  target_ends_at timestamptz,
  target_break_starts_at timestamptz,
  target_break_ends_at timestamptz
)
returns public.schedule_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  organization_id uuid;
  old_entry public.schedule_entries;
  new_entry public.schedule_entries;
begin
  select entry.* into old_entry
  from public.schedule_entries entry
  where entry.id = target_entry_id
  for update;
  if not found then
    raise exception 'ScheduleEntry not found' using errcode = 'P0002';
  end if;

  organization_id := private.schedule_revision_organization_id(
    old_entry.schedule_revision_id
  );

  update public.schedule_entries set
    assignment_id = target_assignment_id,
    starts_at = target_starts_at,
    ends_at = target_ends_at,
    break_starts_at = target_break_starts_at,
    break_ends_at = target_break_ends_at
  where id = target_entry_id
  returning * into new_entry;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    organization_id,
    actor_id,
    'schedule_entry',
    new_entry.id,
    'update',
    public.build_audit_metadata(
      to_jsonb(old_entry),
      to_jsonb(new_entry),
      array[
        'assignment_id', 'starts_at', 'ends_at',
        'break_starts_at', 'break_ends_at'
      ]::text[],
      array['assignment_id', 'starts_at', 'ends_at']::text[]
    )
  );
  return new_entry;
end;
$$;

create or replace function public.update_schedule_entry(
  entry_id uuid,
  assignment_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  break_starts_at timestamptz default null,
  break_ends_at timestamptz default null
)
returns public.schedule_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_id uuid;
begin
  select schedule_item.organization_id into organization_id
  from public.schedule_entries entry
  join public.schedule_revisions revision on revision.id = entry.schedule_revision_id
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where entry.id = update_schedule_entry.entry_id;
  if organization_id is null then
    raise exception 'ScheduleEntry not found' using errcode = 'P0002';
  end if;
  perform private.require_organization_permission(organization_id, 'schedule:update');
  return private.update_schedule_entry(
    update_schedule_entry.entry_id,
    update_schedule_entry.assignment_id,
    update_schedule_entry.starts_at,
    update_schedule_entry.ends_at,
    update_schedule_entry.break_starts_at,
    update_schedule_entry.break_ends_at
  );
end;
$$;

create or replace function private.delete_schedule_entry(target_entry_id uuid)
returns public.schedule_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  organization_id uuid;
  old_entry public.schedule_entries;
begin
  select entry.* into old_entry
  from public.schedule_entries entry
  where entry.id = target_entry_id
  for update;
  if not found then
    raise exception 'ScheduleEntry not found' using errcode = 'P0002';
  end if;

  organization_id := private.schedule_revision_organization_id(
    old_entry.schedule_revision_id
  );
  delete from public.schedule_entries where id = target_entry_id;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    organization_id,
    actor_id,
    'schedule_entry',
    old_entry.id,
    'delete',
    jsonb_build_object(
      'previous_state', jsonb_build_object(
        'schedule_revision_id', old_entry.schedule_revision_id,
        'assignment_id', old_entry.assignment_id,
        'starts_at', old_entry.starts_at,
        'ends_at', old_entry.ends_at
      ),
      'new_state', '{}'::jsonb,
      'changes', jsonb_build_array(
        'schedule_revision_id', 'assignment_id', 'starts_at', 'ends_at',
        'break_starts_at', 'break_ends_at'
      )
    )
  );
  return old_entry;
end;
$$;

create or replace function public.delete_schedule_entry(entry_id uuid)
returns public.schedule_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_id uuid;
begin
  select schedule_item.organization_id into organization_id
  from public.schedule_entries entry
  join public.schedule_revisions revision on revision.id = entry.schedule_revision_id
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where entry.id = delete_schedule_entry.entry_id;
  if organization_id is null then
    raise exception 'ScheduleEntry not found' using errcode = 'P0002';
  end if;
  perform private.require_organization_permission(organization_id, 'schedule:update');
  return private.delete_schedule_entry(delete_schedule_entry.entry_id);
end;
$$;

create or replace function private.transition_schedule_revision(
  target_revision_id uuid,
  target_status text,
  audit_action text
)
returns public.schedule_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  organization_id uuid;
  old_revision public.schedule_revisions;
  new_revision public.schedule_revisions;
begin
  select schedule_item.organization_id into organization_id
  from public.schedule_revisions revision
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where revision.id = target_revision_id;
  if organization_id is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;

  perform organization.id
  from public.organizations organization
  where organization.id = organization_id
  for update;

  select revision.* into old_revision
  from public.schedule_revisions revision
  where revision.id = target_revision_id
  for update;

  if target_status = 'pending_approval' then
    if old_revision.status <> 'draft' then
      raise exception 'Only draft ScheduleRevision can be submitted'
        using errcode = '23514';
    end if;
    perform private.validate_schedule_revision(target_revision_id);
    update public.schedule_revisions set
      status = 'pending_approval',
      submitted_at = now(),
      submitted_by = actor_id
    where id = target_revision_id
    returning * into new_revision;
  elsif target_status = 'approved' then
    if old_revision.status <> 'pending_approval' then
      raise exception 'Only pending ScheduleRevision can be approved'
        using errcode = '23514';
    end if;
    perform private.validate_schedule_revision(target_revision_id);
    update public.schedule_revisions set
      status = 'approved',
      approved_at = now(),
      approved_by = actor_id
    where id = target_revision_id
    returning * into new_revision;
  elsif target_status = 'published' then
    if old_revision.status <> 'approved' then
      raise exception 'Only approved ScheduleRevision can be published'
        using errcode = '23514';
    end if;
    perform private.validate_schedule_revision(target_revision_id);
    update public.schedule_revisions set
      status = 'published',
      published_at = now(),
      published_by = actor_id
    where id = target_revision_id
    returning * into new_revision;
  elsif target_status = 'draft' then
    if old_revision.status not in ('pending_approval', 'approved') then
      raise exception 'Only pending or approved ScheduleRevision can return to draft'
        using errcode = '23514';
    end if;
    update public.schedule_revisions set
      status = 'draft',
      submitted_at = null,
      submitted_by = null,
      approved_at = null,
      approved_by = null,
      published_at = null,
      published_by = null
    where id = target_revision_id
    returning * into new_revision;
  else
    raise exception 'Invalid ScheduleRevision target status'
      using errcode = '22023';
  end if;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    organization_id,
    actor_id,
    'schedule_revision',
    new_revision.id,
    audit_action,
    public.build_audit_metadata(
      to_jsonb(old_revision),
      to_jsonb(new_revision),
      array[
        'status', 'submitted_at', 'submitted_by',
        'approved_at', 'approved_by', 'published_at', 'published_by'
      ]::text[],
      array['status']::text[]
    )
  );
  return new_revision;
end;
$$;

create or replace function public.submit_schedule_revision(schedule_revision_id uuid)
returns public.schedule_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare organization_id uuid;
begin
  organization_id := private.schedule_revision_organization_id(
    submit_schedule_revision.schedule_revision_id
  );
  if organization_id is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;
  perform private.require_organization_permission(organization_id, 'schedule:submit');
  return private.transition_schedule_revision(
    submit_schedule_revision.schedule_revision_id,
    'pending_approval',
    'submit'
  );
end;
$$;

create or replace function public.approve_schedule_revision(schedule_revision_id uuid)
returns public.schedule_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare organization_id uuid;
begin
  organization_id := private.schedule_revision_organization_id(
    approve_schedule_revision.schedule_revision_id
  );
  if organization_id is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;
  perform private.require_organization_permission(organization_id, 'schedule:approve');
  return private.transition_schedule_revision(
    approve_schedule_revision.schedule_revision_id,
    'approved',
    'approve'
  );
end;
$$;

create or replace function public.return_schedule_revision_to_draft(schedule_revision_id uuid)
returns public.schedule_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare organization_id uuid;
begin
  organization_id := private.schedule_revision_organization_id(
    return_schedule_revision_to_draft.schedule_revision_id
  );
  if organization_id is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;
  perform private.require_organization_permission(organization_id, 'schedule:update');
  return private.transition_schedule_revision(
    return_schedule_revision_to_draft.schedule_revision_id,
    'draft',
    'return_to_draft'
  );
end;
$$;

create or replace function public.publish_schedule_revision(schedule_revision_id uuid)
returns public.schedule_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare organization_id uuid;
begin
  organization_id := private.schedule_revision_organization_id(
    publish_schedule_revision.schedule_revision_id
  );
  if organization_id is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;
  perform private.require_organization_permission(organization_id, 'schedule:publish');
  return private.transition_schedule_revision(
    publish_schedule_revision.schedule_revision_id,
    'published',
    'publish'
  );
end;
$$;

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
    created_by
  )
  select
    new_revision.id,
    entry.assignment_id,
    entry.starts_at,
    entry.ends_at,
    entry.break_starts_at,
    entry.break_ends_at,
    actor_id
  from public.schedule_entries entry
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

create or replace function public.create_schedule_revision_from_published(
  schedule_revision_id uuid
)
returns public.schedule_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare organization_id uuid;
begin
  organization_id := private.schedule_revision_organization_id(
    create_schedule_revision_from_published.schedule_revision_id
  );
  if organization_id is null then
    raise exception 'ScheduleRevision not found' using errcode = 'P0002';
  end if;
  perform private.require_organization_permission(organization_id, 'schedule:create');
  return private.create_schedule_revision_from_published(
    create_schedule_revision_from_published.schedule_revision_id
  );
end;
$$;

revoke all on function private.enforce_schedule_organization() from public, anon, authenticated;
revoke all on function private.enforce_schedule_revision_lifecycle() from public, anon, authenticated;
revoke all on function private.validate_schedule_entry_values(uuid, uuid, timestamptz, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function private.enforce_schedule_entry_editability() from public, anon, authenticated;
revoke all on function private.assert_no_schedule_worker_conflicts(uuid) from public, anon, authenticated;
revoke all on function private.validate_schedule_revision(uuid) from public, anon, authenticated;
revoke all on function private.schedule_revision_organization_id(uuid) from public, anon, authenticated;
revoke all on function private.create_schedule(uuid, uuid, date, date) from public, anon, authenticated;
revoke all on function private.create_schedule_entry(uuid, uuid, timestamptz, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function private.update_schedule_entry(uuid, uuid, timestamptz, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function private.delete_schedule_entry(uuid) from public, anon, authenticated;
revoke all on function private.transition_schedule_revision(uuid, text, text) from public, anon, authenticated;
revoke all on function private.create_schedule_revision_from_published(uuid) from public, anon, authenticated;

revoke all on function public.create_schedule(uuid, uuid, date, date) from public, anon;
revoke all on function public.create_schedule_entry(uuid, uuid, timestamptz, timestamptz, timestamptz, timestamptz) from public, anon;
revoke all on function public.update_schedule_entry(uuid, uuid, timestamptz, timestamptz, timestamptz, timestamptz) from public, anon;
revoke all on function public.delete_schedule_entry(uuid) from public, anon;
revoke all on function public.submit_schedule_revision(uuid) from public, anon;
revoke all on function public.approve_schedule_revision(uuid) from public, anon;
revoke all on function public.return_schedule_revision_to_draft(uuid) from public, anon;
revoke all on function public.publish_schedule_revision(uuid) from public, anon;
revoke all on function public.create_schedule_revision_from_published(uuid) from public, anon;

grant execute on function public.create_schedule(uuid, uuid, date, date) to authenticated;
grant execute on function public.create_schedule_entry(uuid, uuid, timestamptz, timestamptz, timestamptz, timestamptz) to authenticated;
grant execute on function public.update_schedule_entry(uuid, uuid, timestamptz, timestamptz, timestamptz, timestamptz) to authenticated;
grant execute on function public.delete_schedule_entry(uuid) to authenticated;
grant execute on function public.submit_schedule_revision(uuid) to authenticated;
grant execute on function public.approve_schedule_revision(uuid) to authenticated;
grant execute on function public.return_schedule_revision_to_draft(uuid) to authenticated;
grant execute on function public.publish_schedule_revision(uuid) to authenticated;
grant execute on function public.create_schedule_revision_from_published(uuid) to authenticated;

comment on table public.schedules is
  'Logical Scheduling plan for one Operation and an explicit non-overlapping civil period.';
comment on table public.schedule_revisions is
  'Versioned Scheduling plan. The highest published version is the current official revision.';
comment on table public.schedule_entries is
  'Concrete UTC work interval anchored to a historically preserved Assignment.';
