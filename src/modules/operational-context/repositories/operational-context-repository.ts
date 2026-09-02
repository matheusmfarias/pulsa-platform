import { createServerSupabaseClient } from "@/shared/db/supabase";

export async function findOperationalContextOptions(organizationId: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("clients")
    .select("id, trade_name, status, contracts(id, name, status)")
    .eq("organization_id", organizationId)
    .order("trade_name", { ascending: true })
    .order("name", { ascending: true, referencedTable: "contracts" });
}
