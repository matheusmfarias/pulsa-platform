-- Exposes only whether the current authenticated user already has a password.
-- The credential hash remains confined to the Auth schema.

create or replace function public.get_my_worker_password_state()
returns table (
  has_password boolean
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
    raise exception 'Worker password state unavailable' using errcode = '42501';
  end if;

  return query
  select nullif(auth_user.encrypted_password, '') is not null
  from auth.users auth_user
  where auth_user.id = actor_id;

  if not found then
    raise exception 'Worker password state unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.get_my_worker_password_state()
  from public, anon, authenticated;
grant execute on function public.get_my_worker_password_state()
  to authenticated;

comment on function public.get_my_worker_password_state() is
  'Returns only whether the current auth.uid() has a password credential.';
