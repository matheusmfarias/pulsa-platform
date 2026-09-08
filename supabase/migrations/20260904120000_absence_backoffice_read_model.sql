-- Phase 5B Absence Backoffice read support.
-- Absence readers need the display name of the profile that reported an
-- Absence, without receiving general access to Organization profiles.

create policy "Members with absence read can read absence reporters"
on public.profiles for select to authenticated
using (
  exists (
    select 1
    from public.absences absence
    where absence.reported_by = profiles.id
      and public.has_organization_permission(
        absence.organization_id,
        'absence:read'
      )
  )
);

comment on policy "Members with absence read can read absence reporters"
  on public.profiles is
  'Allows Absence readers to resolve only profiles referenced as reporters in their Organization.';
