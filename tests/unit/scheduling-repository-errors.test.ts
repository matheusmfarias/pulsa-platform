import { describe, expect, it } from "vitest";

import { throwSchedulingRepositoryError } from "@/modules/scheduling";

describe("Scheduling repository errors", () => {
  it.each([
    [{ code: "23P01", message: "Worker has overlapping entries" }, "CONFLICT"],
    [{ code: "23514", message: "Assignment and Schedule must belong" }, "VALIDATION"],
    [{ code: "23514", message: "Only approved ScheduleRevision can be published" }, "VALIDATION"],
    [{ code: "23514", message: "Published ScheduleRevision is immutable" }, "CONFLICT"],
    [{ code: "23P01", message: "Schedule period exclusion" }, "CONFLICT"],
    [{ code: "42501", message: "Required organization permission missing" }, "AUTHORIZATION"],
  ])("maps predictable RPC errors", (error, code) => {
    try {
      throwSchedulingRepositoryError(error, "test");
    } catch (thrown) {
      expect(thrown).toMatchObject({ code });
    }
  });
});
