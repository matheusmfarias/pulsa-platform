import { createServerSupabaseClient } from "@/shared/db/supabase";

export async function findActiveOrganizationMemberships(profileId: string) {
  const supabase = await createServerSupabaseClient();

  return supabase
    .from("organization_members")
    .select("organization_id, role, organizations!inner(status)")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .eq("organizations.status", "active")
    .limit(2);
}
