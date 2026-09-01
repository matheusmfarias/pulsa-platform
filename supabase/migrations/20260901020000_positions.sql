create table public.positions (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  title text not null,
  description text,
  base_required_headcount integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint positions_title_not_blank check (length(btrim(title)) > 0),
  constraint positions_title_length check (length(title) <= 160),
  constraint positions_description_not_blank check (
    description is null or length(btrim(description)) > 0
  ),
  constraint positions_description_length check (
    description is null or length(description) <= 2000
  ),
  constraint positions_headcount_valid check (base_required_headcount >= 0),
  constraint positions_status_valid check (status in ('active', 'inactive'))
);

create index positions_unit_id_idx on public.positions (unit_id);
create index positions_status_idx on public.positions (status);

alter table public.positions enable row level security;

create policy "Members can read positions in their organization"
on public.positions
for select
to authenticated
using (
  exists (
    select 1
    from public.units unit
    join public.operations operation on operation.id = unit.operation_id
    join public.contracts contract on contract.id = operation.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = positions.unit_id
      and public.is_active_organization_member(client.organization_id)
  )
);

create policy "Members can create positions in their organization"
on public.positions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.units unit
    join public.operations operation on operation.id = unit.operation_id
    join public.contracts contract on contract.id = operation.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = positions.unit_id
      and public.is_active_organization_member(client.organization_id)
  )
);

create policy "Members can update positions in their organization"
on public.positions
for update
to authenticated
using (
  exists (
    select 1
    from public.units unit
    join public.operations operation on operation.id = unit.operation_id
    join public.contracts contract on contract.id = operation.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = positions.unit_id
      and public.is_active_organization_member(client.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.units unit
    join public.operations operation on operation.id = unit.operation_id
    join public.contracts contract on contract.id = operation.contract_id
    join public.clients client on client.id = contract.client_id
    where unit.id = positions.unit_id
      and public.is_active_organization_member(client.organization_id)
  )
);

revoke all on public.positions from anon, authenticated;
grant select, insert, update on public.positions to authenticated;
