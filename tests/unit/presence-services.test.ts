import { beforeEach, describe, expect, it, vi } from "vitest";

import { requirePermission } from "@/modules/authorization";
import {
  cancelPresence,
  completePresence,
  correctPresence,
  getPresenceById,
  listPresences,
  startPresence,
} from "@/modules/presences";
import {
  cancelPresenceRecord,
  completePresenceRecord,
  correctPresenceRecord,
  findPresenceById,
  findPresences,
  startPresenceRecord,
} from "@/modules/presences/repositories/presence-repository";

vi.mock("@/modules/authorization", () => ({ requirePermission: vi.fn() }));
vi.mock("@/modules/presences/repositories/presence-repository", () => ({
  cancelPresenceRecord: vi.fn(),
  completePresenceRecord: vi.fn(),
  correctPresenceRecord: vi.fn(),
  findPresenceById: vi.fn(),
  findPresences: vi.fn(),
  startPresenceRecord: vi.fn(),
}));

const organizationId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000701";
const presence = {
  id: "00000000-0000-4000-8000-000000000801",
  organization_id: organizationId,
  schedule_entry_id: "00000000-0000-4000-8000-000000000501",
  actual_assignment_id: "00000000-0000-4000-8000-000000000301",
  replacement_id: null,
  status: "present",
  arrived_at: "2026-09-10T11:00:00Z",
  departed_at: null,
  source: "manual",
  source_reference: null,
  created_at: "2026-09-10T11:01:00Z",
  created_by: userId,
  completed_at: null,
  completed_by: null,
  corrected_at: null,
  corrected_by: null,
  correction_reason: null,
  cancelled_at: null,
  cancelled_by: null,
  cancellation_reason: null,
};

describe("Presence services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue({
      organizationId,
      userId,
      role: "DIRECTOR",
    });
  });

  it("starts Presence without accepting an actual Assignment from the caller", async () => {
    vi.mocked(startPresenceRecord).mockResolvedValue({ data: presence, error: null } as never);
    const input = {
      schedule_entry_id: presence.schedule_entry_id,
      arrived_at: presence.arrived_at,
      idempotency_key: "arrival-1",
    };

    await expect(startPresence(input)).resolves.toEqual(presence);
    expect(requirePermission).toHaveBeenCalledWith("presence:create");
    expect(startPresenceRecord).toHaveBeenCalledWith(organizationId, {
      ...input,
      source: "manual",
      source_reference: null,
    });
  });

  it("completes, corrects and cancels through their protected permissions", async () => {
    const completed = {
      ...presence,
      status: "completed",
      departed_at: "2026-09-10T19:00:00Z",
      completed_at: "2026-09-10T19:01:00Z",
      completed_by: userId,
    };
    const cancelled = {
      ...completed,
      status: "cancelled",
      cancelled_at: "2026-09-10T19:02:00Z",
      cancelled_by: userId,
      cancellation_reason: "Duplicidade",
    };
    vi.mocked(completePresenceRecord).mockResolvedValue({ data: completed, error: null } as never);
    vi.mocked(correctPresenceRecord).mockResolvedValue({ data: completed, error: null } as never);
    vi.mocked(cancelPresenceRecord).mockResolvedValue({ data: cancelled, error: null } as never);

    await completePresence({
      presence_id: presence.id,
      departed_at: completed.departed_at,
      idempotency_key: "departure-1",
    });
    await correctPresence({
      presence_id: presence.id,
      arrived_at: presence.arrived_at,
      departed_at: completed.departed_at,
      reason: "Ajuste confirmado",
      idempotency_key: "correction-1",
    });
    await cancelPresence({
      presence_id: presence.id,
      reason: "Duplicidade",
      idempotency_key: "cancel-1",
    });

    expect(requirePermission).toHaveBeenNthCalledWith(1, "presence:update");
    expect(requirePermission).toHaveBeenNthCalledWith(2, "presence:update");
    expect(requirePermission).toHaveBeenNthCalledWith(3, "presence:cancel");
  });

  it("uses presence:read and Organization-scoped repositories", async () => {
    vi.mocked(findPresenceById).mockResolvedValue({ data: presence, error: null } as never);
    vi.mocked(findPresences).mockResolvedValue({ data: [presence], error: null } as never);

    await expect(getPresenceById(presence.id)).resolves.toEqual(presence);
    await expect(listPresences()).resolves.toEqual([presence]);
    expect(requirePermission).toHaveBeenNthCalledWith(1, "presence:read");
    expect(requirePermission).toHaveBeenNthCalledWith(2, "presence:read");
    expect(findPresenceById).toHaveBeenCalledWith(organizationId, presence.id);
    expect(findPresences).toHaveBeenCalledWith(organizationId);
  });

  it("maps database conflicts to a safe domain error", async () => {
    vi.mocked(startPresenceRecord).mockResolvedValue({
      data: null,
      error: {
        code: "23505",
        message: "presences_one_current_per_schedule_entry_idx",
      },
    } as never);

    await expect(
      startPresence({
        schedule_entry_id: presence.schedule_entry_id,
        arrived_at: presence.arrived_at,
        idempotency_key: "arrival-2",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

