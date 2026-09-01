-- PL/pgSQL otherwise rejects statements where RPC parameter names intentionally
-- match business-table column names (for example organization_id and client_id).
-- Recreate the already-deployed functions with a per-body conflict directive;
-- CREATE OR REPLACE preserves their signatures, ownership and grants.
do $$
declare
  function_oid oid;
  definition text;
  corrected_definition text;
begin
  for function_oid in
    select routine.oid
    from pg_proc routine
    join pg_namespace namespace on namespace.oid = routine.pronamespace
    where namespace.nspname = 'public'
      and routine.proname = any(array[
        'mutate_client_with_audit',
        'mutate_contract_with_audit',
        'mutate_operation_with_audit',
        'mutate_unit_with_audit',
        'mutate_position_with_audit',
        'mutate_worker_with_audit',
        'change_organization_membership_with_audit'
      ])
  loop
    definition := pg_get_functiondef(function_oid);
    corrected_definition := regexp_replace(
      definition,
      'AS \$function\$\s*',
      E'AS $function$\n#variable_conflict use_variable\n',
      'i'
    );
    if corrected_definition = definition then
      raise exception 'Could not inject variable conflict directive into function %', function_oid;
    end if;
    execute corrected_definition;
  end loop;
end;
$$;
