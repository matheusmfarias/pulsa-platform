import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOptionalWorkerAccess,
  requireWorkerAccess,
} from "@/modules/worker-access/services/require-worker-access";
import { resolveWorkerAccessRecord } from "@/modules/worker-access/repositories/worker-access-repository";

vi.mock(
  "@/modules/worker-access/repositories/worker-access-repository",
  () => ({ resolveWorkerAccessRecord: vi.fn() }),
);

describe("requireWorkerAccess", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only the server-resolved Worker context", async () => {
    vi.mocked(resolveWorkerAccessRecord).mockResolvedValue({
      data: {
        user_id: "00000000-0000-4000-8000-000000000001",
        worker_id: "00000000-0000-4000-8000-000000000002",
        organization_id: "00000000-0000-4000-8000-000000000003",
        worker_name: "Maria Worker",
      },
      error: null,
      count: null,
      status: 200,
      statusText: "OK",
      success: true,
    } as never);

    await expect(requireWorkerAccess()).resolves.toEqual({
      userId: "00000000-0000-4000-8000-000000000001",
      workerId: "00000000-0000-4000-8000-000000000002",
      organizationId: "00000000-0000-4000-8000-000000000003",
      workerName: "Maria Worker",
    });
    expect(resolveWorkerAccessRecord).toHaveBeenCalledWith();
  });

  it("blocks an authenticated user rejected by the database boundary", async () => {
    vi.mocked(resolveWorkerAccessRecord).mockResolvedValue({
      data: null,
      error: {
        code: "42501",
        message: "Worker access unavailable",
        details: "",
        hint: "",
        name: "PostgrestError",
      },
      count: null,
      status: 403,
      statusText: "Forbidden",
      success: false,
    } as never);

    await expect(requireWorkerAccess()).rejects.toMatchObject({
      code: "AUTHORIZATION",
    });
    await expect(getOptionalWorkerAccess()).resolves.toBeNull();
  });
});
