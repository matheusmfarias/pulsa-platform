-- H1.1: current published revisions alone occupy Workers during replacement.
create or replace function private.replacement_schedule_entry_conflict(worker_id uuid, starts_at timestamptz, ends_at timestamptz)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.schedule_entries e join public.assignments a on a.id=e.assignment_id join public.schedule_revisions r on r.id=e.schedule_revision_id where a.worker_id=replacement_schedule_entry_conflict.worker_id and (r.status in ('pending_approval','approved') or (r.status='published' and r.version=(select max(pr.version) from public.schedule_revisions pr where pr.schedule_id=r.schedule_id and pr.status='published'))) and tstzrange(e.starts_at,e.ends_at,'[)') && tstzrange(replacement_schedule_entry_conflict.starts_at,replacement_schedule_entry_conflict.ends_at,'[)'));
$$;

create or replace function private.create_replacement(aid uuid, candidate_assignment uuid)
returns public.replacements language plpgsql security definer set search_path='' as $$
declare c record; candidate record; item public.replacements; actor uuid:=auth.uid(); start_date date; end_date date;
begin
 perform 1 from public.absences where id=aid for update; if not found then raise exception 'Absence not found' using errcode='P0002'; end if;
 select * into c from private.replacement_context(aid); if c.absence_status <> 'reported' then raise exception 'Only a reported Absence can be replaced' using errcode='23514'; end if;
 if exists(select 1 from public.replacements where absence_id=aid and status='active') then raise exception 'Absence already has an active Replacement' using errcode='23505'; end if;
 select x.worker_id,x.position_id,x.status,x.start_date,x.end_date,w.organization_id,w.status worker_status,u.timezone into candidate from public.assignments x join public.workers w on w.id=x.worker_id join public.positions p on p.id=x.position_id join public.units u on u.id=p.unit_id where x.id=candidate_assignment;
 if not found then raise exception 'Assignment not found' using errcode='P0002'; end if;
 if candidate.organization_id<>c.org or candidate.position_id<>c.position_id or candidate.worker_id=c.absent_worker or candidate.status not in ('pending','active') or candidate.worker_status<>'active' then raise exception 'Replacement Assignment is not eligible' using errcode='23514'; end if;
 start_date := (c.starts_at at time zone candidate.timezone)::date; end_date := ((c.ends_at-interval '1 microsecond') at time zone candidate.timezone)::date;
 if start_date<candidate.start_date or (candidate.end_date is not null and end_date>candidate.end_date) then raise exception 'Replacement Assignment does not cover the ScheduleEntry interval' using errcode='23514'; end if;
 if private.replacement_schedule_entry_conflict(candidate.worker_id,c.starts_at,c.ends_at) then raise exception 'Replacement Worker has a ScheduleEntry conflict' using errcode='23P01'; end if;
 if exists(select 1 from public.replacements z join public.absences a on a.id=z.absence_id join public.schedule_entries e on e.id=a.schedule_entry_id join public.assignments x on x.id=z.replacement_assignment_id where z.status='active' and z.organization_id=c.org and x.worker_id=candidate.worker_id and tstzrange(e.starts_at,e.ends_at,'[)') && tstzrange(c.starts_at,c.ends_at,'[)')) then raise exception 'Replacement Worker has a Replacement conflict' using errcode='23P01'; end if;
 insert into public.replacements(organization_id,absence_id,replacement_assignment_id,created_by) values(c.org,aid,candidate_assignment,actor) returning * into item;
 insert into public.audit_events(organization_id,actor_user_id,entity_type,entity_id,action,metadata) values(item.organization_id,actor,'replacement',item.id,'create',jsonb_build_object('previous_state','{}'::jsonb,'new_state',jsonb_build_object('absence_id',item.absence_id,'replacement_assignment_id',item.replacement_assignment_id,'status',item.status),'changes',jsonb_build_array('absence_id','replacement_assignment_id','status'))); return item;
end $$;
revoke all on function private.replacement_schedule_entry_conflict(uuid,timestamptz,timestamptz),private.create_replacement(uuid,uuid) from public,anon,authenticated;
