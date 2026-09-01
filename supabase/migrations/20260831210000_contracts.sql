create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null,
  start_date date not null,
  end_date date,
  status text not null default 'draft',
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_name_not_blank check (length(btrim(name)) > 0),
  constraint contracts_name_length check (length(name) <= 160),
  constraint contracts_external_reference_not_blank check (
    external_reference is null or length(btrim(external_reference)) > 0
  ),
  constraint contracts_external_reference_length check (
    external_reference is null or length(external_reference) <= 160
  ),
  constraint contracts_status_valid check (
    status in ('draft', 'active', 'suspended', 'ended', 'cancelled')
  ),
  constraint contracts_dates_valid check (
    end_date is null or end_date >= start_date
  )
);

create index contracts_client_id_idx on public.contracts (client_id);
create index contracts_status_idx on public.contracts (status);

alter table public.contracts enable row level security;

create policy "Members can read contracts in their organization"
on public.contracts
for select
to authenticated
using (
  exists (
    select 1
    from public.clients client
    where client.id = contracts.client_id
      and public.is_active_organization_member(client.organization_id)
  )
);

create policy "Members can create contracts in their organization"
on public.contracts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.clients client
    where client.id = contracts.client_id
      and public.is_active_organization_member(client.organization_id)
  )
);

create policy "Members can update contracts in their organization"
on public.contracts
for update
to authenticated
using (
  exists (
    select 1
    from public.clients client
    where client.id = contracts.client_id
      and public.is_active_organization_member(client.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.clients client
    where client.id = contracts.client_id
      and public.is_active_organization_member(client.organization_id)
  )
);

revoke all on public.contracts from anon, authenticated;
grant select, insert, update on public.contracts to authenticated;

comment on table public.contracts is
  'Commercial relationship owned through Client. Organization is intentionally derived.';
