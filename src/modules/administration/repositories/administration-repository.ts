import { createServerSupabaseClient } from "@/shared/db/supabase";

import type { AuditListFilters } from "../schemas/administration-schemas";
import { AUDIT_PAGE_SIZE } from "../schemas/administration-schemas";

const MEMBER_SELECT =
  "organization_id, profile_id, role, status, created_at, updated_at, profile:profiles!organization_members_profile_id_fkey(id, display_name)";
const AUDIT_LIST_SELECT =
  "id, organization_id, actor_user_id, entity_type, entity_id, action, metadata, created_at, actor:profiles!audit_events_actor_user_id_fkey(id, display_name)";

export async function findOrganizationMembers(organizationId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("organization_members")
    .select(MEMBER_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
}

export async function findOrganizationMemberById(
  organizationId: string,
  profileId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("organization_members")
    .select(MEMBER_SELECT)
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId)
    .maybeSingle();
}

export async function mutateOrganizationMembership(
  organizationId: string,
  profileId: string,
  role: string,
  status: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("change_organization_membership_with_audit", {
    organization_id: organizationId,
    target_profile_id: profileId,
    target_role: role,
    target_status: status,
  });
}

export async function findAuditEvents(
  organizationId: string,
  filters: AuditListFilters,
) {
  const supabase = await createServerSupabaseClient();
  const start = (filters.page - 1) * AUDIT_PAGE_SIZE;
  let query = supabase
    .from("audit_events")
    .select(AUDIT_LIST_SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(start, start + AUDIT_PAGE_SIZE - 1);

  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00.000Z`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.actorId) query = query.eq("actor_user_id", filters.actorId);

  return query;
}

export async function findAuditEventById(
  organizationId: string,
  auditEventId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("audit_events")
    .select(
      `${AUDIT_LIST_SELECT}, organization:organizations!audit_events_organization_id_fkey(id, trade_name)`,
    )
    .eq("organization_id", organizationId)
    .eq("id", auditEventId)
    .maybeSingle();
}
