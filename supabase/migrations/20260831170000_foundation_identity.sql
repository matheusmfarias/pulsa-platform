-- Foundation identity only. Business modules are intentionally out of scope.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_legal_name_not_blank check (length(btrim(legal_name)) > 0),
  constraint organizations_trade_name_not_blank check (length(btrim(trade_name)) > 0),
  constraint organizations_status_valid check (status in ('active', 'inactive'))
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (
    display_name is null or length(btrim(display_name)) > 0
  )
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, profile_id),
  constraint organization_members_status_valid check (status in ('active', 'inactive'))
);

create index organization_members_profile_id_idx
  on public.organization_members (profile_id);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;

create function public.is_active_organization_member(target_organization_id uuid)
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
  );
$$;

revoke all on function public.is_active_organization_member(uuid) from public;
grant execute on function public.is_active_organization_member(uuid) to authenticated;

create policy "Members can read their organizations"
on public.organizations
for select
to authenticated
using (public.is_active_organization_member(id));

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Members can read memberships in their organizations"
on public.organization_members
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.is_active_organization_member(organization_id)
);

revoke all on public.organizations from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.organization_members from anon, authenticated;

grant select on public.organizations to authenticated;
grant select on public.profiles to authenticated;
grant select on public.organization_members to authenticated;

comment on function public.is_active_organization_member(uuid) is
  'Foundation helper for organization isolation. It does not implement RBAC or client access.';
