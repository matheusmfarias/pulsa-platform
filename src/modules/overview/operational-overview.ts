import { z } from "zod";

import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";
import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { findOperationalOverview } from "./overview-repository";

export const operationalOverviewSchema = z.object({
  kpis: z.object({
    activeAssignments: z.number().int().nonnegative(),
    activeOperations: z.number().int().nonnegative(),
    activePositions: z.number().int().nonnegative(),
    activeUnits: z.number().int().nonnegative(),
    activeWorkers: z.number().int().nonnegative(),
    totalRequiredHeadcount: z.number().int().nonnegative(),
  }),
  attention: z.object({
    activeWorkersWithoutAssignment: z.number().int().nonnegative(),
    underfilledPositions: z.number().int().nonnegative(),
  }),
  operations: z.array(
    z.object({
      allocatedWorkers: z.number().int().nonnegative(),
      clientName: z.string(),
      id: z.string().uuid(),
      name: z.string(),
      positions: z.number().int().nonnegative(),
      units: z.number().int().nonnegative(),
    }),
  ),
});

export type OperationalOverview = z.infer<typeof operationalOverviewSchema>;

export async function getOperationalOverview(
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<OperationalOverview> {
  const { organizationId } = await requirePermission("operation:read");
  const { data, error } = await findOperationalOverview(
    organizationId,
    operationalContext,
  );

  if (error) {
    logger.error({
      errorCode: error.code,
      event: "overview.operational_aggregate_failed",
      operation: "get_operational_overview",
    });
    throw new AppError("INFRASTRUCTURE", "Falha ao carregar a visão geral.");
  }

  return operationalOverviewSchema.parse(data);
}
