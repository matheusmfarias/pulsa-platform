import type { WorkerListFilters } from "../schemas/worker-schemas";
import { workerListFiltersSchema } from "../schemas/worker-schemas";

export type WorkerListSearchParams = {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
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

export function parseWorkerListPage(searchParams: WorkerListSearchParams): number {
  const rawPage = firstValue(searchParams.page);
  if (rawPage && !/^\d+$/.test(rawPage)) return 1;
  const page = rawPage ? Number.parseInt(rawPage, 10) : 1;
  return Number.isSafeInteger(page) && page > 0 && page <= 100_000 ? page : 1;
}

export function workerListHref(
  pathname: "/app/workers" | "/app/workers/new",
  filters: WorkerListFilters,
  page = 1,
): string {
  const searchParams = new URLSearchParams();
  if (filters.query) searchParams.set("q", filters.query);
  if (filters.status !== "all") searchParams.set("status", filters.status);
  if (page > 1) searchParams.set("page", String(page));
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function hasActiveWorkerFilters(filters: WorkerListFilters): boolean {
  return Boolean(filters.query) || filters.status !== "all";
}
