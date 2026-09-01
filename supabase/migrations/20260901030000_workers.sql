create table public.workers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  full_name text not null,
  document_number text not null,
  email text,
  phone text,
  status text not null default 'onboarding',
  engagement_start_date date,
  engagement_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workers_full_name_not_blank check (length(btrim(full_name)) > 0),
  constraint workers_full_name_length check (length(full_name) <= 160),
  constraint workers_document_number_normalized check (document_number ~ '^[0-9]{11}$'),
  constraint workers_email_not_blank check (email is null or length(btrim(email)) > 0),
  constraint workers_email_length check (email is null or length(email) <= 254),
  constraint workers_phone_not_blank check (phone is null or length(btrim(phone)) > 0),
  constraint workers_phone_length check (phone is null or length(phone) <= 30),
  constraint workers_status_valid check (
    status in ('onboarding', 'active', 'inactive', 'terminated')
  ),
  constraint workers_engagement_dates_valid check (
    engagement_end_date is null
    or engagement_start_date is null
    or engagement_end_date >= engagement_start_date
  ),
  constraint workers_organization_document_unique unique (organization_id, document_number)
);

create index workers_organization_id_idx on public.workers (organization_id);
create index workers_organization_status_idx on public.workers (organization_id, status);
create index workers_organization_full_name_idx on public.workers (organization_id, full_name);

alter table public.workers enable row level security;

create policy "Active members can read workers"
on public.workers for select to authenticated
using (public.is_active_organization_member(organization_id));

create policy "Active members can create workers"
on public.workers for insert to authenticated
with check (public.is_active_organization_member(organization_id));

create policy "Active members can update workers"
on public.workers for update to authenticated
using (public.is_active_organization_member(organization_id))
with check (public.is_active_organization_member(organization_id));

revoke all on public.workers from anon, authenticated;
grant select, insert, update on public.workers to authenticated;

comment on table public.workers is
  'People eligible for future assignments. Worker does not imply a specific employment relationship.';
