-- Preserve the operational meaning of historical Assignments without adding a
-- generic temporal model. Structural context remains editable until it has
-- participated in an Assignment; after that, replacement is safer than moves.

create or replace function private.prevent_position_unit_history_rewrite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.unit_id is distinct from old.unit_id
    and exists (
      select 1 from public.assignments assignment_item
      where assignment_item.position_id = old.id
    ) then
    raise exception 'Não é possível mover esta Position para outra Unit porque ela já possui histórico de Assignments.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_unit_operation_history_rewrite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.operation_id is distinct from old.operation_id
    and exists (
      select 1
      from public.positions position
      join public.assignments assignment_item on assignment_item.position_id = position.id
      where position.unit_id = old.id
    ) then
    raise exception 'Não é possível mover esta Unit para outra Operation porque ela já possui histórico de Assignments.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_operation_contract_history_rewrite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.contract_id is distinct from old.contract_id
    and exists (
      select 1
      from public.units unit
      join public.positions position on position.unit_id = unit.id
      join public.assignments assignment_item on assignment_item.position_id = position.id
      where unit.operation_id = old.id
    ) then
    raise exception 'Não é possível mover esta Operation para outro Contract porque ela já possui histórico de Assignments.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_contract_client_history_rewrite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.client_id is distinct from old.client_id
    and exists (
      select 1
      from public.operations operation_item
      join public.units unit on unit.operation_id = operation_item.id
      join public.positions position on position.unit_id = unit.id
      join public.assignments assignment_item on assignment_item.position_id = position.id
      where operation_item.contract_id = old.id
    ) then
    raise exception 'Não é possível mover este Contract para outro Client porque ele já possui histórico de Assignments.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_assignment_history_edit_policy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status in ('active', 'suspended')
    and (
      new.worker_id is distinct from old.worker_id
      or new.position_id is distinct from old.position_id
      or new.start_date is distinct from old.start_date
    ) then
    raise exception 'Não é possível alterar Worker, Position ou data inicial de uma Assignment ativa ou suspensa.'
      using errcode = '23514';
  end if;

  if old.status in ('finished', 'cancelled')
    and (
      new.worker_id is distinct from old.worker_id
      or new.position_id is distinct from old.position_id
      or new.start_date is distinct from old.start_date
      or new.end_date is distinct from old.end_date
    ) then
    raise exception 'Não é possível reescrever o contexto ou período de uma Assignment finalizada ou cancelada.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_operation_dates_within_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  contract_start_date date;
  contract_end_date date;
begin
  select contract.start_date, contract.end_date
    into contract_start_date, contract_end_date
  from public.contracts contract
  where contract.id = new.contract_id;

  if contract_start_date is not null and new.start_date < contract_start_date then
    raise exception 'A data inicial da Operation não pode ser anterior à data inicial do Contract.'
      using errcode = '23514';
  end if;
  if new.end_date is not null
    and contract_end_date is not null
    and new.end_date > contract_end_date then
    raise exception 'A data final da Operation não pode ser posterior à data final do Contract.'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and exists (
    select 1
    from public.units unit
    join public.positions position on position.unit_id = unit.id
    join public.assignments assignment_item on assignment_item.position_id = position.id
    where unit.operation_id = old.id
      and (
        assignment_item.start_date < new.start_date
        or (
          new.end_date is not null
          and assignment_item.end_date is not null
          and assignment_item.end_date > new.end_date
        )
      )
  ) then
    raise exception 'As datas da Operation não podem excluir Assignments já registradas.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_contract_dates_with_operations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.operations operation_item
    where operation_item.contract_id = old.id
      and (
        operation_item.start_date < new.start_date
        or (
          new.end_date is not null
          and operation_item.end_date is not null
          and operation_item.end_date > new.end_date
        )
      )
  ) then
    raise exception 'As datas do Contract não podem excluir Operations já registradas.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_assignment_dates_with_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  worker_start_date date;
  worker_end_date date;
  operation_start_date date;
  operation_end_date date;
begin
  select worker.engagement_start_date, worker.engagement_end_date
    into worker_start_date, worker_end_date
  from public.workers worker
  where worker.id = new.worker_id;

  select operation_item.start_date, operation_item.end_date
    into operation_start_date, operation_end_date
  from public.positions position
  join public.units unit on unit.id = position.unit_id
  join public.operations operation_item on operation_item.id = unit.operation_id
  where position.id = new.position_id;

  if worker_start_date is not null and new.start_date < worker_start_date then
    raise exception 'A data inicial da Assignment não pode ser anterior ao início do vínculo do Worker.'
      using errcode = '23514';
  end if;
  if operation_start_date is not null and new.start_date < operation_start_date then
    raise exception 'A data inicial da Assignment não pode ser anterior ao início da Operation.'
      using errcode = '23514';
  end if;
  if new.end_date is not null
    and worker_end_date is not null
    and new.end_date > worker_end_date then
    raise exception 'A data final da Assignment não pode ser posterior ao fim do vínculo do Worker.'
      using errcode = '23514';
  end if;
  if new.end_date is not null
    and operation_end_date is not null
    and new.end_date > operation_end_date then
    raise exception 'A data final da Assignment não pode ser posterior ao fim da Operation.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_worker_dates_with_assignments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.engagement_start_date is not null and exists (
    select 1
    from public.assignments assignment_item
    where assignment_item.worker_id = old.id
      and assignment_item.start_date < new.engagement_start_date
  ) then
    raise exception 'O início do vínculo do Worker não pode excluir Assignments já registradas.'
      using errcode = '23514';
  end if;
  if new.engagement_end_date is not null and exists (
    select 1
    from public.assignments assignment_item
    where assignment_item.worker_id = old.id
      and assignment_item.end_date is not null
      and assignment_item.end_date > new.engagement_end_date
  ) then
    raise exception 'O fim do vínculo do Worker não pode excluir Assignments já registradas.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_position_unit_history_rewrite on public.positions;
create trigger prevent_position_unit_history_rewrite
before update on public.positions
for each row execute function private.prevent_position_unit_history_rewrite();

drop trigger if exists prevent_unit_operation_history_rewrite on public.units;
create trigger prevent_unit_operation_history_rewrite
before update on public.units
for each row execute function private.prevent_unit_operation_history_rewrite();

drop trigger if exists prevent_operation_contract_history_rewrite on public.operations;
create trigger prevent_operation_contract_history_rewrite
before update on public.operations
for each row execute function private.prevent_operation_contract_history_rewrite();

drop trigger if exists prevent_contract_client_history_rewrite on public.contracts;
create trigger prevent_contract_client_history_rewrite
before update on public.contracts
for each row execute function private.prevent_contract_client_history_rewrite();

drop trigger if exists enforce_assignment_history_edit_policy on public.assignments;
create trigger enforce_assignment_history_edit_policy
before update on public.assignments
for each row execute function private.enforce_assignment_history_edit_policy();

drop trigger if exists enforce_operation_dates_within_contract on public.operations;
create trigger enforce_operation_dates_within_contract
before insert or update on public.operations
for each row execute function private.enforce_operation_dates_within_contract();

drop trigger if exists enforce_contract_dates_with_operations on public.contracts;
create trigger enforce_contract_dates_with_operations
before update on public.contracts
for each row execute function private.enforce_contract_dates_with_operations();

drop trigger if exists enforce_assignment_dates_with_context on public.assignments;
create trigger enforce_assignment_dates_with_context
before insert or update on public.assignments
for each row execute function private.enforce_assignment_dates_with_context();

drop trigger if exists enforce_worker_dates_with_assignments on public.workers;
create trigger enforce_worker_dates_with_assignments
before update on public.workers
for each row execute function private.enforce_worker_dates_with_assignments();

revoke all on function private.prevent_position_unit_history_rewrite() from public, anon, authenticated;
revoke all on function private.prevent_unit_operation_history_rewrite() from public, anon, authenticated;
revoke all on function private.prevent_operation_contract_history_rewrite() from public, anon, authenticated;
revoke all on function private.prevent_contract_client_history_rewrite() from public, anon, authenticated;
revoke all on function private.enforce_assignment_history_edit_policy() from public, anon, authenticated;
revoke all on function private.enforce_operation_dates_within_contract() from public, anon, authenticated;
revoke all on function private.enforce_contract_dates_with_operations() from public, anon, authenticated;
revoke all on function private.enforce_assignment_dates_with_context() from public, anon, authenticated;
revoke all on function private.enforce_worker_dates_with_assignments() from public, anon, authenticated;
