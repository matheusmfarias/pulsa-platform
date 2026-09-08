import { z } from "zod";

export const operationalContextSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all") }),
  z.object({ type: z.literal("client"), clientId: z.uuid() }),
  z.object({
    type: z.literal("contract"),
    clientId: z.uuid(),
    contractId: z.uuid(),
  }),
]);

export type OperationalContext = z.infer<typeof operationalContextSchema>;

export type OperationalContextOption = {
  id: string;
  name: string;
  status: string;
  contracts: Array<{
    id: string;
    name: string;
    status: string;
  }>;
};

export type OperationalContextState = {
  context: OperationalContext;
  options: OperationalContextOption[];
};

export const ALL_OPERATIONAL_CONTEXT: OperationalContext = { type: "all" };

export const OPERATIONAL_CONTEXT_QUERY_PATHS = {
  contracts: { client: "client_id", contract: "id" },
  operations: { client: "contract.client_id", contract: "contract_id" },
  schedules: {
    client: "operation.contract.client_id",
    contract: "operation.contract_id",
  },
  absences: {
    client:
      "schedule_entry.schedule_revision.schedule.operation.contract.client_id",
    contract:
      "schedule_entry.schedule_revision.schedule.operation.contract.id",
  },
  units: {
    client: "operation.contract.client_id",
    contract: "operation.contract.id",
  },
  positions: {
    client: "unit.operation.contract.client_id",
    contract: "unit.operation.contract.id",
  },
  assignments: {
    client: "position.unit.operation.contract.client_id",
    contract: "position.unit.operation.contract.id",
  },
  workers: {
    client: "assignments.position.unit.operation.contract.client_id",
    contract: "assignments.position.unit.operation.contract.id",
  },
} as const;

export function parseOperationalContextCookie(
  value: string | null | undefined,
): OperationalContext {
  if (!value || value === "all") return ALL_OPERATIONAL_CONTEXT;

  const [type, firstId, secondId, extra] = value.split(":");
  if (extra) return ALL_OPERATIONAL_CONTEXT;

  const candidate =
    type === "client"
      ? { type, clientId: firstId }
      : type === "contract"
        ? { type, clientId: firstId, contractId: secondId }
        : null;

  const parsed = operationalContextSchema.safeParse(candidate);
  return parsed.success ? parsed.data : ALL_OPERATIONAL_CONTEXT;
}

export function serializeOperationalContext(
  context: OperationalContext,
): string {
  if (context.type === "all") return "all";
  if (context.type === "client") return `client:${context.clientId}`;
  return `contract:${context.clientId}:${context.contractId}`;
}

export function resolveOperationalContextSelection(
  requested: OperationalContext,
  options: OperationalContextOption[],
): OperationalContext {
  if (requested.type === "all") return requested;

  const client = options.find((option) => option.id === requested.clientId);
  if (!client) return ALL_OPERATIONAL_CONTEXT;
  if (requested.type === "client") return requested;

  return client.contracts.some((contract) => contract.id === requested.contractId)
    ? requested
    : ALL_OPERATIONAL_CONTEXT;
}

export type OperationalContextFilterQuery<T> = {
  eq(column: string, value: string): T;
};

export function applyOperationalContextFilter<
  T extends OperationalContextFilterQuery<T>,
>(
  query: T,
  context: OperationalContext,
  paths: { client: string; contract: string },
): T {
  if (context.type === "client") {
    return query.eq(paths.client, context.clientId);
  }
  if (context.type === "contract") {
    return query.eq(paths.contract, context.contractId);
  }
  return query;
}

export function safePathAfterOperationalContextChange(pathname: string): string {
  const compatibleListings = new Set([
    "/app",
    "/app/contracts",
    "/app/operations",
    "/app/units",
    "/app/positions",
    "/app/assignments",
    "/app/scheduling",
    "/app/absences",
    "/app/presences",
    "/app/workers",
  ]);
  if (compatibleListings.has(pathname)) return pathname;

  if (pathname.startsWith("/app/contracts/")) return "/app/contracts";
  if (pathname.startsWith("/app/operations/")) return "/app/operations";
  if (/^\/app\/units\/[^/]+\/positions(?:\/|$)/.test(pathname)) {
    return "/app/positions";
  }
  if (pathname.startsWith("/app/units/")) return "/app/units";
  if (pathname.startsWith("/app/assignments/")) return "/app/assignments";
  if (pathname.startsWith("/app/absences/")) return "/app/absences";
  if (pathname.startsWith("/app/workers/")) return "/app/workers";

  return pathname.startsWith("/app/clients") ||
    pathname.startsWith("/app/job-roles") ||
    pathname.startsWith("/app/admin")
    ? pathname
    : "/app";
}
