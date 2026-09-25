import { createServerSupabaseClient } from "@/shared/db/supabase";
import { measureServerStage } from "@/shared/logging";

export async function findOperationalContextOptions(organizationId: string) {
  const supabase = await createServerSupabaseClient();
  return measureServerStage("operational_context.options", () =>
    supabase
      .from("clients")
      .select("id, trade_name, status, contracts(id, name, status)")
      .eq("organization_id", organizationId)
      .order("trade_name", { ascending: true })
      .order("name", { ascending: true, referencedTable: "contracts" }),
  );
}
