-- Keep assignment tenant checks intact while avoiding nested RLS evaluation
-- across the full organization hierarchy for every returned assignment.
create function public.can_read_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.assignments assignment
    join public.workers worker on worker.id = assignment.worker_id
    join public.positions position on position.id = assignment.position_id
    join public.units unit on unit.id = position.unit_id
    join public.operations operation_item on operation_item.id = unit.operation_id
    join public.contracts contract on contract.id = operation_item.contract_id
    join public.clients client on client.id = contract.client_id
    join public.organization_members membership
      on membership.organization_id = worker.organization_id
     and membership.profile_id = auth.uid()
     and membership.status = 'active'
    where assignment.id = target_assignment_id
      and worker.organization_id = client.organization_id
  );
$$;

revoke all on function public.can_read_assignment(uuid) from public, anon;
grant execute on function public.can_read_assignment(uuid) to authenticated;

drop policy "Active members can read assignments" on public.assignments;

create policy "Active members can read assignments"
on public.assignments for select to authenticated
using (public.can_read_assignment(id));

comment on function public.can_read_assignment(uuid) is
  'Checks assignment tenant consistency and active membership without recursively applying RLS to its hierarchy joins.';
