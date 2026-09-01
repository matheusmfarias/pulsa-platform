create table public.units (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations(id) on delete restrict,
  name text not null,
  code text,
  address text,
  city text,
  state text,
  timezone text not null default 'America/Sao_Paulo',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint units_name_not_blank check (length(btrim(name)) > 0),
  constraint units_name_length check (length(name) <= 160),
  constraint units_code_not_blank check (code is null or length(btrim(code)) > 0),
  constraint units_code_length check (code is null or length(code) <= 64),
  constraint units_address_not_blank check (address is null or length(btrim(address)) > 0),
  constraint units_address_length check (address is null or length(address) <= 300),
  constraint units_city_not_blank check (city is null or length(btrim(city)) > 0),
  constraint units_city_length check (city is null or length(city) <= 120),
  constraint units_state_not_blank check (state is null or length(btrim(state)) > 0),
  constraint units_state_length check (state is null or length(state) <= 80),
  constraint units_timezone_not_blank check (length(btrim(timezone)) > 0),
  constraint units_timezone_length check (length(timezone) <= 100),
  constraint units_status_valid check (status in ('active', 'inactive'))
);

create index units_operation_id_idx on public.units (operation_id);
create index units_status_idx on public.units (status);
create unique index units_operation_code_unique_idx
  on public.units (operation_id, lower(code))
  where code is not null;

alter table public.units enable row level security;

create policy "Members can read units in their organization"
on public.units
for select
to authenticated
using (
  exists (
    select 1
    from public.operations operation
    join public.contracts contract on contract.id = operation.contract_id
    join public.clients client on client.id = contract.client_id
    where operation.id = units.operation_id
      and public.is_active_organization_member(client.organization_id)
  )
);

create policy "Members can create units in their organization"
on public.units
for insert
to authenticated
with check (
  exists (
    select 1
    from public.operations operation
    join public.contracts contract on contract.id = operation.contract_id
    join public.clients client on client.id = contract.client_id
    where operation.id = units.operation_id
      and public.is_active_organization_member(client.organization_id)
  )
);

create policy "Members can update units in their organization"
on public.units
for update
to authenticated
using (
  exists (
    select 1
    from public.operations operation
    join public.contracts contract on contract.id = operation.contract_id
    join public.clients client on client.id = contract.client_id
    where operation.id = units.operation_id
      and public.is_active_organization_member(client.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.operations operation
    join public.contracts contract on contract.id = operation.contract_id
    join public.clients client on client.id = contract.client_id
    where operation.id = units.operation_id
      and public.is_active_organization_member(client.organization_id)
  )
);

revoke all on public.units from anon, authenticated;
grant select, insert, update on public.units to authenticated;
