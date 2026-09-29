import type { OperationalContext } from "@/modules/operational-context";
import { createServerSupabaseClient } from "@/shared/db/supabase";
import { measureServerStage } from "@/shared/logging";

export async function findOperationalOverview(
  organizationId: string,
  context: OperationalContext,
) {
  const supabase = await createServerSupabaseClient();

  return measureServerStage("overview.aggregate_query", () =>
    supabase.rpc("get_operational_overview", {
      target_organization_id: organizationId,
      target_context_type: context.type,
      target_client_id: context.type === "all" ? null : context.clientId,
      target_contract_id: context.type === "contract" ? context.contractId : null,
    }),
  );
}
