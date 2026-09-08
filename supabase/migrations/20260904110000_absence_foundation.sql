-- Phase 5A Absence Foundation.
-- An Absence records that the Worker assigned to a concrete ScheduleEntry
-- cannot fulfill it. Replacement and attendance workflows are intentionally
-- outside this foundation.

create table public.absences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  schedule_entry_id uuid not null references public.schedule_entries(id) on delete restrict,
  reason text not null,
  notes text,
  status text not null default 'reported',
  reported_at timestamptz not null default now(),
  reported_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint absences_reason_valid check (
    reason in ('sick', 'medical_certificate', 'personal', 'no_show', 'other')
  ),
  constraint absences_status_valid check (status in ('reported', 'cancelled')),
  constraint absences_notes_length check (notes is null or char_length(notes) <= 2000)
);

create unique index absences_one_reported_per_schedule_entry_idx
  on public.absences (schedule_entry_id)
  where status = 'reported';
create index absences_organization_reported_at_idx
  on public.absences (organization_id, reported_at desc);

alter table public.absences enable row level security;

create policy "Members with absence read can read absences"
on public.absences for select to authenticated
using (
  public.has_organization_permission(organization_id, 'absence:read')
);

revoke all on table public.absences from anon, authenticated;
grant select on table public.absences to authenticated;

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
            'absence:read', 'absence:create', 'absence:cancel'
          ]::text[]
          when 'SUPERVISOR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'unit:update', 'job_role:read',
            'position:read', 'position:update',
            'worker:read', 'assignment:read',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel'
          ]::text[]
          when 'HR' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'worker:update',
            'assignment:read', 'assignment:update',
            'schedule:read', 'schedule:create', 'schedule:update',
            'schedule:submit', 'schedule:approve', 'schedule:publish',
            'absence:read', 'absence:create', 'absence:cancel'
          ]::text[]
          when 'RECRUITER' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'worker:create', 'assignment:read',
            'schedule:read', 'absence:read'
          ]::text[]
          when 'ADMINISTRATIVE' then array[
            'client:read', 'contract:read', 'operation:read',
            'unit:read', 'job_role:read', 'position:read',
            'worker:read', 'assignment:read', 'schedule:read',
            'absence:read'
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
    'schedule_revision', 'schedule_entry', 'absence'
  )
);

alter table public.audit_events drop constraint audit_events_action_valid;
alter table public.audit_events add constraint audit_events_action_valid check (
  action in (
    'create', 'update', 'delete', 'status_change', 'membership_change',
    'submit', 'approve', 'return_to_draft', 'publish',
    'create_from_published', 'cancel'
  )
);

create or replace function private.schedule_entry_organization_id(
  target_schedule_entry_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select schedule_item.organization_id
  from public.schedule_entries entry
  join public.schedule_revisions revision
    on revision.id = entry.schedule_revision_id
  join public.schedules schedule_item on schedule_item.id = revision.schedule_id
  where entry.id = target_schedule_entry_id;
$$;

create or replace function private.enforce_absence_schedule_entry_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_organization_id uuid;
begin
  entry_organization_id := private.schedule_entry_organization_id(new.schedule_entry_id);
  if entry_organization_id is null then
    raise exception 'ScheduleEntry not found' using errcode = '23503';
  end if;
  if entry_organization_id <> new.organization_id then
    raise exception 'Absence and ScheduleEntry must belong to the same Organization'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger enforce_absence_schedule_entry_organization
before insert or update of organization_id, schedule_entry_id on public.absences
for each row execute function private.enforce_absence_schedule_entry_organization();

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
  new_absence public.absences;
begin
  insert into public.absences (
    organization_id, schedule_entry_id, reason, notes, reported_by
  ) values (
    target_organization_id,
    target_schedule_entry_id,
    target_reason,
    nullif(btrim(target_notes), ''),
    actor_id
  ) returning * into new_absence;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    new_absence.organization_id,
    actor_id,
    'absence',
    new_absence.id,
    'create',
    jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object(
        'schedule_entry_id', new_absence.schedule_entry_id,
        'reason', new_absence.reason,
        'notes', new_absence.notes,
        'status', new_absence.status,
        'reported_at', new_absence.reported_at,
        'reported_by', new_absence.reported_by
      ),
      'changes', jsonb_build_array(
        'schedule_entry_id', 'reason', 'notes', 'status',
        'reported_at', 'reported_by'
      )
    )
  );

  return new_absence;
end;
$$;

create or replace function public.create_absence(
  organization_id uuid,
  schedule_entry_id uuid,
  reason text,
  notes text default null
)
returns public.absences
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_organization_id uuid;
begin
  perform private.require_organization_permission(
    create_absence.organization_id,
    'absence:create'
  );

  entry_organization_id := private.schedule_entry_organization_id(
    create_absence.schedule_entry_id
  );
  if entry_organization_id is null then
    raise exception 'ScheduleEntry not found' using errcode = 'P0002';
  end if;
  if entry_organization_id <> create_absence.organization_id then
    raise exception 'Absence and ScheduleEntry must belong to the same Organization'
      using errcode = '23514';
  end if;

  return private.create_absence(
    create_absence.organization_id,
    create_absence.schedule_entry_id,
    create_absence.reason,
    create_absence.notes
  );
end;
$$;

create or replace function private.cancel_absence(target_absence_id uuid)
returns public.absences
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  old_absence public.absences;
  cancelled_absence public.absences;
begin
  select absence.* into old_absence
  from public.absences absence
  where absence.id = target_absence_id
  for update;

  if not found then
    raise exception 'Absence not found' using errcode = 'P0002';
  end if;
  if old_absence.status <> 'reported' then
    raise exception 'Only a reported Absence can be cancelled'
      using errcode = '23514';
  end if;

  update public.absences
  set status = 'cancelled'
  where id = target_absence_id
  returning * into cancelled_absence;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (
    cancelled_absence.organization_id,
    actor_id,
    'absence',
    cancelled_absence.id,
    'cancel',
    public.build_audit_metadata(
      to_jsonb(old_absence),
      to_jsonb(cancelled_absence),
      array['status']::text[]
    )
  );

  return cancelled_absence;
end;
$$;

create or replace function public.cancel_absence(
  organization_id uuid,
  absence_id uuid
)
returns public.absences
language plpgsql
security definer
set search_path = ''
as $$
declare
  absence_organization_id uuid;
begin
  perform private.require_organization_permission(
    cancel_absence.organization_id,
    'absence:cancel'
  );

  select absence.organization_id into absence_organization_id
  from public.absences absence
  where absence.id = cancel_absence.absence_id;
  if absence_organization_id is null then
    raise exception 'Absence not found' using errcode = 'P0002';
  end if;
  if absence_organization_id <> cancel_absence.organization_id then
    raise exception 'Absence belongs to another Organization'
      using errcode = '23514';
  end if;

  return private.cancel_absence(cancel_absence.absence_id);
end;
$$;

revoke all on function private.schedule_entry_organization_id(uuid)
  from public, anon, authenticated;
revoke all on function private.enforce_absence_schedule_entry_organization()
  from public, anon, authenticated;
revoke all on function private.create_absence(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function private.cancel_absence(uuid)
  from public, anon, authenticated;

revoke all on function public.create_absence(uuid, uuid, text, text)
  from public, anon;
revoke all on function public.cancel_absence(uuid, uuid)
  from public, anon;
grant execute on function public.create_absence(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.cancel_absence(uuid, uuid)
  to authenticated;

comment on table public.absences is
  'Historical inability of the Worker assigned to a ScheduleEntry to fulfill that entry. Replacement is outside this entity.';
