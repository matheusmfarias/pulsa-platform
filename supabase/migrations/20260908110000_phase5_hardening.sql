-- Checkpoint H1: authoritative Phase 5 corrections. Existing history is immutable.

create or replace function private.create_absence(target_organization_id uuid,target_schedule_entry_id uuid,target_reason text,target_notes text)
returns public.absences language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); item public.absences;
begin
  if not exists (
    select 1 from public.schedule_entries e join public.schedule_revisions r on r.id=e.schedule_revision_id
    where e.id=target_schedule_entry_id and r.status='published' and r.version=(select max(pr.version) from public.schedule_revisions pr where pr.schedule_id=r.schedule_id and pr.status='published')
  ) then raise exception 'Absence can only be reported for the current published ScheduleEntry' using errcode='23514'; end if;
  insert into public.absences(organization_id,schedule_entry_id,reason,notes,reported_by) values(target_organization_id,target_schedule_entry_id,target_reason,nullif(btrim(target_notes),''),actor_id) returning * into item;
  insert into public.audit_events(organization_id,actor_user_id,entity_type,entity_id,action,metadata) values(item.organization_id,actor_id,'absence',item.id,'create',jsonb_build_object('previous_state','{}'::jsonb,'new_state',to_jsonb(item),'changes',jsonb_build_array('schedule_entry_id','reason','notes','status')));
  return item;
end $$;

create or replace function private.cancel_absence(target_absence_id uuid)
returns public.absences language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); old_item public.absences; item public.absences;
begin
 select a.* into old_item from public.absences a where a.id=target_absence_id for update;
 if not found then raise exception 'Absence not found' using errcode='P0002'; end if;
 if old_item.status<>'reported' then raise exception 'Only a reported Absence can be cancelled' using errcode='23514'; end if;
 if exists(select 1 from public.replacements r where r.absence_id=old_item.id and r.status='active') then raise exception 'Cancele a substituição ativa antes de cancelar a ausência.' using errcode='23514'; end if;
 update public.absences a set status='cancelled' where a.id=target_absence_id returning * into item;
 insert into public.audit_events(organization_id,actor_user_id,entity_type,entity_id,action,metadata) values(item.organization_id,actor_id,'absence',item.id,'cancel',public.build_audit_metadata(to_jsonb(old_item),to_jsonb(item),array['status']::text[])); return item;
end $$;

create or replace function public.list_replacement_candidates(organization_id uuid,absence_id uuid)
returns table(assignment_id uuid,worker_id uuid,worker_full_name text) language sql security definer set search_path='' as $$
 select x.id,w.id,w.full_name from private.replacement_context(absence_id) c join public.assignments x on x.position_id=c.position_id join public.workers w on w.id=x.worker_id join public.positions p on p.id=x.position_id join public.units u on u.id=p.unit_id
 where public.has_organization_permission(list_replacement_candidates.organization_id,'replacement:create') and c.org=list_replacement_candidates.organization_id and c.absence_status='reported' and x.status in ('pending','active') and w.status='active' and w.id<>c.absent_worker
 and (c.starts_at at time zone u.timezone)::date>=x.start_date and (x.end_date is null or ((c.ends_at-interval '1 microsecond') at time zone u.timezone)::date<=x.end_date)
 and not exists(select 1 from public.schedule_entries e join public.assignments sx on sx.id=e.assignment_id join public.schedule_revisions r on r.id=e.schedule_revision_id where sx.worker_id=w.id and (r.status in ('pending_approval','approved') or (r.status='published' and r.version=(select max(pr.version) from public.schedule_revisions pr where pr.schedule_id=r.schedule_id and pr.status='published'))) and tstzrange(e.starts_at,e.ends_at,'[)') && tstzrange(c.starts_at,c.ends_at,'[)'))
 and not exists(select 1 from public.replacements z join public.absences a on a.id=z.absence_id join public.schedule_entries e on e.id=a.schedule_entry_id join public.assignments zx on zx.id=z.replacement_assignment_id where z.status='active' and zx.worker_id=w.id and tstzrange(e.starts_at,e.ends_at,'[)') && tstzrange(c.starts_at,c.ends_at,'[)')) order by w.full_name $$;

revoke all on function private.create_absence(uuid,uuid,text,text),private.cancel_absence(uuid) from public,anon,authenticated;
revoke all on function public.list_replacement_candidates(uuid,uuid) from anon;
grant execute on function public.list_replacement_candidates(uuid,uuid) to authenticated;

-- Keep create_replacement authoritative even if its candidate query changes:
-- only pending/approved and the current published revision occupy a Worker.
create or replace function private.enforce_replacement_schedule_conflict() returns trigger language plpgsql security definer set search_path='' as $$
declare candidate_worker uuid; target_start timestamptz; target_end timestamptz;
begin
  if new.status <> 'active' then return new; end if;
  select a.worker_id,e.starts_at,e.ends_at into candidate_worker,target_start,target_end
  from public.assignments a join public.absences x on x.id=new.absence_id join public.schedule_entries e on e.id=x.schedule_entry_id
  where a.id=new.replacement_assignment_id;
  if exists (
    select 1 from public.schedule_entries e join public.assignments a on a.id=e.assignment_id join public.schedule_revisions r on r.id=e.schedule_revision_id
    where a.worker_id=candidate_worker and (r.status in ('pending_approval','approved') or (r.status='published' and r.version=(select max(pr.version) from public.schedule_revisions pr where pr.schedule_id=r.schedule_id and pr.status='published')))
      and tstzrange(e.starts_at,e.ends_at,'[)') && tstzrange(target_start,target_end,'[)')
  ) then raise exception 'Replacement Worker has a ScheduleEntry conflict' using errcode='23P01'; end if;
  return new;
end $$;
create trigger enforce_replacement_schedule_conflict before insert on public.replacements for each row execute function private.enforce_replacement_schedule_conflict();
