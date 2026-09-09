import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireWorkerAccess } from "@/modules/worker-access";
import {
  completeWorkerPresenceRecord,
  findWorkerPresenceAction,
  listWorkerPresenceHistoryRecords,
  startWorkerPresenceRecord,
} from "@/modules/worker-presence/repositories/worker-presence-repository";
import {
  completeWorkerPresence,
  getWorkerPresenceAction,
  listWorkerPresenceHistory,
  startWorkerPresence,
} from "@/modules/worker-presence/services/worker-presence";

vi.mock("@/modules/worker-access", () => ({ requireWorkerAccess: vi.fn() }));
vi.mock(
  "@/modules/worker-presence/repositories/worker-presence-repository",
  () => ({
    completeWorkerPresenceRecord: vi.fn(),
    findWorkerPresenceAction: vi.fn(),
    listWorkerPresenceHistoryRecords: vi.fn(),
    startWorkerPresenceRecord: vi.fn(),
  }),
);

const scheduleEntryId = "00000000-0000-4000-8000-000000000101";
const idempotencyKey = "00000000-0000-4000-8000-000000000102";
const sourceReference = "00000000-0000-4000-8000-000000000103";
const access = {
  userId: "00000000-0000-4000-8000-000000000001",
  workerId: "00000000-0000-4000-8000-000000000002",
  organizationId: "00000000-0000-4000-8000-000000000003",
  workerName: "Worker",
};

describe("Worker Presence services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireWorkerAccess).mockResolvedValue(access);
  });

  it("requires WorkerAccess and sends only the narrow start command", async () => {
    vi.mocked(startWorkerPresenceRecord).mockResolvedValue({
      data: {
        schedule_entry_id: scheduleEntryId,
        status: "present",
        arrived_at: "2026-09-08T15:00:00Z",
        departed_at: null,
      },
      error: null,
    } as never);
    const result = await startWorkerPresence({
      scheduleEntryId,
      sourceReference,
      idempotencyKey,
    });
    expect(requireWorkerAccess).toHaveBeenCalledBefore(
      vi.mocked(startWorkerPresenceRecord),
    );
    expect(startWorkerPresenceRecord).toHaveBeenCalledWith({
      scheduleEntryId,
      sourceReference,
      idempotencyKey,
    });
    expect(result).toEqual({
      scheduleEntryId,
      status: "present",
      arrivedAt: "2026-09-08T15:00:00Z",
      departedAt: null,
    });
    expect(result).not.toHaveProperty("workerId");
    expect(result).not.toHaveProperty("organizationId");
  });

  it("sends completion without client source, identity or time", async () => {
    vi.mocked(completeWorkerPresenceRecord).mockResolvedValue({
      data: {
        schedule_entry_id: scheduleEntryId,
        status: "completed",
        arrived_at: "2026-09-08T15:00:00Z",
        departed_at: "2026-09-08T15:01:00Z",
      },
      error: null,
    } as never);
    await completeWorkerPresence({ scheduleEntryId, idempotencyKey });
    expect(completeWorkerPresenceRecord).toHaveBeenCalledWith({
      scheduleEntryId,
      idempotencyKey,
    });
  });

  it("maps unavailable ownership uniformly and never exposes repository details", async () => {
    vi.mocked(startWorkerPresenceRecord).mockResolvedValue({
      data: null,
      error: { code: "P0002", message: "foreign worker id" },
    } as never);
    await expect(
      startWorkerPresence({ scheduleEntryId, sourceReference, idempotencyKey }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Esta jornada não está disponível para registrar chegada.",
    });
  });

  it("validates UUIDs before any Presence RPC", async () => {
    await expect(getWorkerPresenceAction("other-worker")).resolves.toBeNull();
    await expect(
      startWorkerPresence({
        scheduleEntryId,
        sourceReference: "guessable-device-value",
        idempotencyKey,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(findWorkerPresenceAction).not.toHaveBeenCalled();
    expect(startWorkerPresenceRecord).not.toHaveBeenCalled();
  });

  it("resolves server action truth after the WorkerAccess boundary", async () => {
    vi.mocked(findWorkerPresenceAction).mockResolvedValue({
      data: "complete",
      error: null,
    } as never);
    await expect(getWorkerPresenceAction(scheduleEntryId)).resolves.toBe("complete");
    expect(requireWorkerAccess).toHaveBeenCalledBefore(
      vi.mocked(findWorkerPresenceAction),
    );
  });

  it("returns minimized valid history with a pair cursor", async () => {
    const row = {
      schedule_entry_id: scheduleEntryId,
      presence_status: "completed",
      arrived_at: "2026-09-08T15:00:00Z",
      departed_at: "2026-09-08T16:00:00Z",
      starts_at: "2026-09-08T14:00:00Z",
      ends_at: "2026-09-08T17:00:00Z",
      local_date: "2026-09-08",
      operation_name: "Operação",
      unit_name: "Unidade",
      unit_timezone: "America/Sao_Paulo",
      job_role_name: "Auxiliar",
      worker_role: "original",
      arrived_after_start: true,
      departed_before_end: true,
    };
    vi.mocked(listWorkerPresenceHistoryRecords).mockResolvedValue({
      data: [row],
      error: null,
    } as never);
    const page = await listWorkerPresenceHistory({ limit: 1 });
    expect(requireWorkerAccess).toHaveBeenCalledBefore(
      vi.mocked(listWorkerPresenceHistoryRecords),
    );
    expect(page.entries[0]).toMatchObject({
      scheduleEntryId,
      workerRole: "original",
      arrivedAfterStart: true,
    });
    expect(page.entries[0]).not.toHaveProperty("workerId");
    expect(page.nextCursor).toEqual({
      arrivedAt: row.arrived_at,
      scheduleEntryId,
    });
  });

  it("rejects incomplete or invalid history cursors", async () => {
    await expect(
      listWorkerPresenceHistory({
        beforeArrivedAt: "not-a-date",
        beforeScheduleEntryId: scheduleEntryId,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      listWorkerPresenceHistory({
        beforeArrivedAt: "2026-09-08T15:00:00Z",
        beforeScheduleEntryId: null,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(listWorkerPresenceHistoryRecords).not.toHaveBeenCalled();
  });
});
