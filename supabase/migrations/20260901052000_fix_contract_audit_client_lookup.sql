-- Recreate the Contract audit RPC with the corrected client lookup.
--
-- This migration originally used a textual replacement against the deployed
-- function body. The current foundation migration already contains the target
-- lookup, so a fresh reset could not find the legacy text and failed. CREATE OR
-- REPLACE is deterministic for both states and preserves ownership and grants.

create or replace function public.mutate_contract_with_audit(
  operation text,
  entity_id uuid default null,
  client_id uuid default null,
  name text default null,
  start_date date default null,
  end_date date default null,
  external_reference text default null,
  target_status text default null
)
returns public.contracts
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  actor_id uuid := auth.uid();
  old_row public.contracts;
  new_row public.contracts;
  organization_id uuid;
  target_organization_id uuid;
  audit_action text;
  audit_metadata jsonb;
  tracked text[] := array[
    'client_id', 'name', 'start_date', 'end_date', 'external_reference', 'status'
  ];
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;

  select client.organization_id into target_organization_id
  from public.clients client
  where client.id = mutate_contract_with_audit.client_id;
  if operation = 'create' then
    if target_organization_id is null then raise exception 'Client not found' using errcode = '23503'; end if;
    if not public.is_active_organization_member(target_organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    insert into public.contracts (
      client_id, name, start_date, end_date, external_reference, status
    ) values (client_id, name, start_date, end_date, external_reference, 'draft')
    returning * into new_row;
    organization_id := target_organization_id;
    audit_action := 'create';
    audit_metadata := jsonb_build_object(
      'previous_state', '{}'::jsonb,
      'new_state', jsonb_build_object('status', new_row.status),
      'changes', to_jsonb(tracked)
    );
  else
    select contract.* into old_row
    from public.contracts contract where contract.id = entity_id for update;
    if not found then raise exception 'Contract not found' using errcode = 'P0002'; end if;
    select client.organization_id into organization_id
    from public.clients client where client.id = old_row.client_id;
    if not public.is_active_organization_member(organization_id) then
      raise exception 'Active organization membership required' using errcode = '42501';
    end if;
    if operation = 'update' then
      if target_organization_id is null then raise exception 'Client not found' using errcode = '23503'; end if;
      if target_organization_id <> organization_id then
        raise exception 'Cross-organization reassignment denied' using errcode = '42501';
      end if;
      update public.contracts set
        client_id = mutate_contract_with_audit.client_id,
        name = mutate_contract_with_audit.name,
        start_date = mutate_contract_with_audit.start_date,
        end_date = mutate_contract_with_audit.end_date,
        external_reference = mutate_contract_with_audit.external_reference,
        updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'update';
    elsif operation = 'status_change' then
      update public.contracts set status = target_status, updated_at = now()
      where id = entity_id returning * into new_row;
      audit_action := 'status_change';
    else
      raise exception 'Invalid audit mutation operation' using errcode = '22023';
    end if;
    audit_metadata := public.build_audit_metadata(
      to_jsonb(old_row), to_jsonb(new_row), tracked
    );
  end if;

  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, action, metadata
  ) values (organization_id, actor_id, 'contract', new_row.id, audit_action, audit_metadata);
  return new_row;
end;
$$;
