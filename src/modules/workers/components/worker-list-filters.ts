import type { WorkerListFilters } from "../schemas/worker-schemas";
import { workerListFiltersSchema } from "../schemas/worker-schemas";

export type WorkerListSearchParams = {
  q?: string | string[];
  status?: string | string[];
};

export const WORKER_CREATED_FEEDBACK = "worker-created";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseWorkerListSearchParams(
  searchParams: WorkerListSearchParams,
): WorkerListFilters {
  return workerListFiltersSchema.parse({
    query: firstValue(searchParams.q),
    status: firstValue(searchParams.status),
  });
}

export function workerListHref(
  pathname: "/app/workers" | "/app/workers/new",
  filters: WorkerListFilters,
): string {
  const searchParams = new URLSearchParams();
  if (filters.query) searchParams.set("q", filters.query);
  if (filters.status !== "all") searchParams.set("status", filters.status);
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function hasActiveWorkerFilters(filters: WorkerListFilters): boolean {
  return Boolean(filters.query) || filters.status !== "all";
}
