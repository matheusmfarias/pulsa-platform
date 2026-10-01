export const WORKER_LIST_PAGE_SIZES = [10, 25, 50] as const;
export type WorkerListPageSize = (typeof WORKER_LIST_PAGE_SIZES)[number];
export const WORKER_LIST_PAGE_SIZE: WorkerListPageSize = 10;
