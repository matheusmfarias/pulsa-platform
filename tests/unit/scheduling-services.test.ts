import { beforeEach, describe, expect, it, vi } from "vitest";

import { requirePermission } from "@/modules/authorization";
import { createSchedule, publishScheduleRevision } from "@/modules/scheduling";
import { createScheduleRecord, transitionRevision } from "@/modules/scheduling/repositories/scheduling-repository";

vi.mock("@/modules/authorization", () => ({ requirePermission: vi.fn() }));
vi.mock("@/modules/scheduling/repositories/scheduling-repository", () => ({
  createScheduleRecord: vi.fn(), transitionRevision: vi.fn(),
}));

const schedule = {
  id: "00000000-0000-4000-8000-000000000401", organization_id: "00000000-0000-4000-8000-000000000001", operation_id: "00000000-0000-4000-8000-000000000101", period_start: "2026-09-01", period_end: "2026-09-30", created_at: "2026-01-01T00:00:00Z", created_by: "00000000-0000-4000-8000-000000000701",
};
const revision = { id: "00000000-0000-4000-8000-000000000501", schedule_id: schedule.id, version: 1, status: "published", based_on_revision_id: null, created_at: "2026-01-01T00:00:00Z", created_by: schedule.created_by, submitted_at: "2026-01-01T00:00:00Z", submitted_by: schedule.created_by, approved_at: "2026-01-01T00:00:00Z", approved_by: schedule.created_by, published_at: "2026-01-01T00:00:00Z", published_by: schedule.created_by };

describe("Scheduling services", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires schedule:create and calls the protected Schedule RPC", async () => {
    vi.mocked(createScheduleRecord).mockResolvedValue({ data: schedule, error: null } as never);
    await expect(createSchedule({ organization_id: schedule.organization_id, operation_id: schedule.operation_id, period_start: schedule.period_start, period_end: schedule.period_end })).resolves.toMatchObject({ id: schedule.id });
    expect(requirePermission).toHaveBeenCalledWith("schedule:create");
  });

  it("requires schedule:publish and maps lifecycle failures", async () => {
    vi.mocked(transitionRevision).mockResolvedValue({ data: null, error: { code: "23514", message: "Only approved ScheduleRevision can be published" } } as never);
    await expect(publishScheduleRevision(revision.id)).rejects.toMatchObject({ code: "VALIDATION" });
    expect(requirePermission).toHaveBeenCalledWith("schedule:publish");
  });
});
