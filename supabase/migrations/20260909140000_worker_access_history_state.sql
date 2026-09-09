-- Distinguishes first activation from reactivation using WorkerAccess history.

create or replace function public.get_my_worker_access_history_state()
returns table (
  has_prior_access boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Worker access history unavailable' using errcode = '42501';
  end if;

  return query
  select exists (
    select 1
    from public.worker_access_links access_link
    where access_link.profile_id = actor_id
  );
end;
$$;

revoke all on function public.get_my_worker_access_history_state()
  from public, anon, authenticated;
grant execute on function public.get_my_worker_access_history_state()
  to authenticated;

comment on function public.get_my_worker_access_history_state() is
  'Returns only whether auth.uid() has any historical WorkerAccess link.';
