create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  legal_name text not null,
  trade_name text not null,
  document_number text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_legal_name_not_blank check (length(btrim(legal_name)) > 0),
  constraint clients_trade_name_not_blank check (length(btrim(trade_name)) > 0),
  constraint clients_document_number_normalized check (document_number ~ '^[0-9]{14}$'),
  constraint clients_status_valid check (status in ('active', 'inactive')),
  constraint clients_organization_document_number_unique
    unique (organization_id, document_number)
);

alter table public.clients enable row level security;

create policy "Members can read clients in their organization"
on public.clients
for select
to authenticated
using (
  public.is_active_organization_member(organization_id)
  and exists (
    select 1
    from public.organizations organization
    where organization.id = clients.organization_id
      and organization.status = 'active'
  )
);

create policy "Members can create clients in their organization"
on public.clients
for insert
to authenticated
with check (
  public.is_active_organization_member(organization_id)
  and exists (
    select 1
    from public.organizations organization
    where organization.id = clients.organization_id
      and organization.status = 'active'
  )
);

create policy "Members can update clients in their organization"
on public.clients
for update
to authenticated
using (
  public.is_active_organization_member(organization_id)
  and exists (
    select 1
    from public.organizations organization
    where organization.id = clients.organization_id
      and organization.status = 'active'
  )
)
with check (
  public.is_active_organization_member(organization_id)
  and exists (
    select 1
    from public.organizations organization
    where organization.id = clients.organization_id
      and organization.status = 'active'
  )
);

revoke all on public.clients from anon, authenticated;
grant select on public.clients to authenticated;
grant insert (organization_id, legal_name, trade_name, document_number, status)
  on public.clients to authenticated;
grant update (legal_name, trade_name, document_number, status, updated_at)
  on public.clients to authenticated;

comment on table public.clients is
  'Companies served by Pulsa. A client is not an organization or tenant.';
