import type { WorkerListFilters } from "../schemas/worker-schemas";
import { workerListFiltersSchema } from "../schemas/worker-schemas";
import { WORKER_LIST_PAGE_SIZE, WORKER_LIST_PAGE_SIZES, type WorkerListPageSize } from "../domain/worker-list-pagination";
export { WORKER_LIST_PAGE_SIZE, WORKER_LIST_PAGE_SIZES, type WorkerListPageSize } from "../domain/worker-list-pagination";

export type WorkerListSearchParams = {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
  size?: string | string[];
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

export function parseWorkerListPageSize(searchParams: WorkerListSearchParams): WorkerListPageSize {
  const parsed = Number(firstValue(searchParams.size));
  return WORKER_LIST_PAGE_SIZES.includes(parsed as WorkerListPageSize)
    ? (parsed as WorkerListPageSize)
    : WORKER_LIST_PAGE_SIZE;
}

export function workerListHref(
  pathname: "/app/workers" | "/app/workers/new",
  filters: WorkerListFilters,
  page = 1,
  pageSize: WorkerListPageSize = WORKER_LIST_PAGE_SIZE,
): string {
  const searchParams = new URLSearchParams();
  if (filters.query) searchParams.set("q", filters.query);
  if (filters.status !== "all") searchParams.set("status", filters.status);
  if (page > 1) searchParams.set("page", String(page));
  if (pageSize !== WORKER_LIST_PAGE_SIZE) searchParams.set("size", String(pageSize));
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function hasActiveWorkerFilters(filters: WorkerListFilters): boolean {
  return Boolean(filters.query) || filters.status !== "all";
}
