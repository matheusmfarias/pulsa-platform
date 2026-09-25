import { describe, expect, it } from "vitest";

import {
  parseWorkerListPage,
  parseWorkerListSearchParams,
  workerListHref,
} from "@/modules/workers/components/worker-list-filters";

describe("worker list pagination", () => {
  it("parses a valid page and falls back safely for invalid values", () => {
    expect(parseWorkerListPage({ page: "3" })).toBe(3);
    expect(parseWorkerListPage({ page: "0" })).toBe(1);
    expect(parseWorkerListPage({ page: "2oops" })).toBe(1);
    expect(parseWorkerListPage({ page: "999999" })).toBe(1);
    expect(parseWorkerListPage({ page: ["4", "5"] })).toBe(4);
  });

  it("preserves filters while paging and omits the first page from the URL", () => {
    const filters = parseWorkerListSearchParams({ q: "Ana", status: "active" });

    expect(workerListHref("/app/workers", filters, 2)).toBe(
      "/app/workers?q=Ana&status=active&page=2",
    );
    expect(workerListHref("/app/workers", filters, 1)).toBe(
      "/app/workers?q=Ana&status=active",
    );
  });
});
