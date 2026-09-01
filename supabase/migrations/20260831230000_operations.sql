create table public.operations (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete restrict,
  name text not null,
  description text,
  start_date date not null,
  end_date date,
  status text not null default 'planning',
  manager_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operations_name_not_blank check (length(btrim(name)) > 0),
  constraint operations_name_length check (length(name) <= 160),
  constraint operations_description_not_blank check (
    description is null or length(btrim(description)) > 0
  ),
  constraint operations_description_length check (
    description is null or length(description) <= 2000
  ),
  constraint operations_status_valid check (
    status in (
      'planning',
      'implementation',
      'active',
      'suspended',
      'closing',
      'closed'
    )
  ),
  constraint operations_dates_valid check (
    end_date is null or end_date >= start_date
  )
);

create index operations_contract_id_idx on public.operations (contract_id);
create index operations_status_idx on public.operations (status);
create index operations_manager_user_id_idx
  on public.operations (manager_user_id)
  where manager_user_id is not null;

alter table public.operations enable row level security;

create policy "Members can read operations in their organization"
on public.operations
for select
to authenticated
using (
  exists (
    select 1
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where contract.id = operations.contract_id
      and public.is_active_organization_member(client.organization_id)
  )
);

create policy "Members can create operations in their organization"
on public.operations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where contract.id = operations.contract_id
      and public.is_active_organization_member(client.organization_id)
  )
);

create policy "Members can update operations in their organization"
on public.operations
for update
to authenticated
using (
  exists (
    select 1
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where contract.id = operations.contract_id
      and public.is_active_organization_member(client.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.contracts contract
    join public.clients client on client.id = contract.client_id
    where contract.id = operations.contract_id
      and public.is_active_organization_member(client.organization_id)
  )
);

revoke all on public.operations from anon, authenticated;
grant select, insert, update on public.operations to authenticated;

comment on table public.operations is
  'Operational engagement owned through Contract and Client. Hierarchical IDs are intentionally not duplicated.';
