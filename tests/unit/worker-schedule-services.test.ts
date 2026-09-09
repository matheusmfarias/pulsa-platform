import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireWorkerAccess } from "@/modules/worker-access";
import {
  findWorkerScheduleEntryRecord,
  listWorkerScheduleRecords,
} from "@/modules/worker-schedule/repositories/worker-schedule-repository";
import {
  getWorkerScheduleEntry,
  listWorkerSchedule,
} from "@/modules/worker-schedule/services/worker-schedule";

vi.mock("@/modules/worker-access", () => ({ requireWorkerAccess: vi.fn() }));
vi.mock(
  "@/modules/worker-schedule/repositories/worker-schedule-repository",
  () => ({
    findWorkerHomeRecords: vi.fn(),
    findWorkerScheduleEntryRecord: vi.fn(),
    listWorkerScheduleRecords: vi.fn(),
  }),
);

const row = {
  schedule_entry_id: "00000000-0000-4000-8000-000000000101",
  starts_at: "2026-09-08T11:00:00Z",
  ends_at: "2026-09-08T20:00:00Z",
  break_starts_at: null,
  break_ends_at: null,
  local_date: "2026-09-08",
  operation_name: "Operação",
  unit_name: "Unidade",
  unit_timezone: "America/Sao_Paulo",
  unit_address: null,
  unit_city: "São Paulo",
  unit_state: "SP",
  job_role_name: "Auxiliar",
  journey_status: "original_expected",
  presence_status: null,
  arrived_at: null,
  departed_at: null,
  schedule_version: 2,
  published_at: "2026-09-07T14:00:00Z",
  was_republished: true,
};

describe("Worker Schedule services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireWorkerAccess).mockResolvedValue({
      userId: "00000000-0000-4000-8000-000000000001",
      workerId: "00000000-0000-4000-8000-000000000002",
      organizationId: "00000000-0000-4000-8000-000000000003",
      workerName: "Worker",
    });
  });

  it("requires WorkerAccess before listing and maps a minimized DTO", async () => {
    vi.mocked(listWorkerScheduleRecords).mockResolvedValue({
      data: [row],
      error: null,
    } as never);
    const result = await listWorkerSchedule({
      fromDate: "2026-09-08",
      toDate: "2026-09-14",
    });
    expect(requireWorkerAccess).toHaveBeenCalledBefore(
      vi.mocked(listWorkerScheduleRecords),
    );
    expect(result[0]).toMatchObject({
      scheduleEntryId: row.schedule_entry_id,
      journeyStatus: "original_expected",
      unitName: "Unidade",
    });
    expect(result[0]).not.toHaveProperty("workerId");
    expect(result[0]).not.toHaveProperty("assignmentId");
  });

  it("rejects intervals over 31 civil days before the RPC", async () => {
    await expect(
      listWorkerSchedule({ fromDate: "2026-09-01", toDate: "2026-10-02" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(listWorkerScheduleRecords).not.toHaveBeenCalled();
  });

  it("returns not found for an unauthorized entry without leaking details", async () => {
    vi.mocked(findWorkerScheduleEntryRecord).mockResolvedValue({
      data: null,
      error: { code: "P0002", message: "Worker schedule entry not found" },
    } as never);
    await expect(
      getWorkerScheduleEntry("00000000-0000-4000-8000-000000000999"),
    ).rejects.toMatchObject({ code: "NOT_FOUND", message: "Jornada não encontrada." });
  });
});
