import { beforeEach, describe, expect, it, vi } from "vitest";

import { requirePermission } from "@/modules/authorization";
import {
  cancelAbsence,
  createAbsence,
  getAbsenceById,
  listAbsences,
} from "@/modules/absences";
import {
  cancelAbsenceRecord,
  findAbsenceById,
  findAbsences,
  insertAbsence,
} from "@/modules/absences/repositories/absence-repository";

vi.mock("@/modules/authorization", () => ({ requirePermission: vi.fn() }));
vi.mock("@/modules/absences/repositories/absence-repository", () => ({
  cancelAbsenceRecord: vi.fn(),
  findAbsenceById: vi.fn(),
  findAbsenceDetailsById: vi.fn(),
  findAbsences: vi.fn(),
  insertAbsence: vi.fn(),
}));

const organizationId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000701";
const absence = {
  id: "00000000-0000-4000-8000-000000000601",
  organization_id: organizationId,
  schedule_entry_id: "00000000-0000-4000-8000-000000000501",
  reason: "sick",
  notes: null,
  status: "reported",
  reported_at: "2026-09-04T12:00:00Z",
  reported_by: userId,
  created_at: "2026-09-04T12:00:00Z",
};
const absenceListItem = {
  id: absence.id,
  reason: absence.reason,
  status: absence.status,
  replacements: [],
  schedule_entry: {
    starts_at: "2026-09-10T11:00:00Z",
    ends_at: "2026-09-10T19:00:00Z",
    assignment: {
      worker: { full_name: "Ana Souza" },
      position: {
        job_role: { name: "Porteira" },
        unit: {
          name: "Unidade Centro",
          timezone: "America/Sao_Paulo",
          operation: { name: "Operação Centro" },
        },
      },
    },
  },
};

describe("Absence services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue({
      organizationId,
      userId,
      role: "DIRECTOR",
    });
  });

  it("creates a valid Absence through the protected RPC repository", async () => {
    vi.mocked(insertAbsence).mockResolvedValue({ data: absence, error: null } as never);

    await expect(
      createAbsence({
        schedule_entry_id: absence.schedule_entry_id,
        reason: absence.reason,
      }),
    ).resolves.toEqual(absence);
    expect(requirePermission).toHaveBeenCalledWith("absence:create");
    expect(insertAbsence).toHaveBeenCalledWith(organizationId, {
      schedule_entry_id: absence.schedule_entry_id,
      reason: "sick",
      notes: null,
    });
  });

  it("maps a duplicate active Absence to conflict", async () => {
    vi.mocked(insertAbsence).mockResolvedValue({
      data: null,
      error: {
        code: "23505",
        message: "absences_one_reported_per_schedule_entry_idx",
      },
    } as never);

    await expect(
      createAbsence({
        schedule_entry_id: absence.schedule_entry_id,
        reason: "personal",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("cancels an active Absence through the protected RPC repository", async () => {
    const cancelled = { ...absence, status: "cancelled" };
    vi.mocked(cancelAbsenceRecord).mockResolvedValue({
      data: cancelled,
      error: null,
    } as never);

    await expect(cancelAbsence(absence.id)).resolves.toEqual(cancelled);
    expect(requirePermission).toHaveBeenCalledWith("absence:cancel");
    expect(cancelAbsenceRecord).toHaveBeenCalledWith(organizationId, absence.id);
  });

  it("uses absence:read and the active Organization for both reads", async () => {
    vi.mocked(findAbsenceById).mockResolvedValue({ data: absence, error: null } as never);
    vi.mocked(findAbsences).mockResolvedValue({ data: [absenceListItem], error: null } as never);

    await expect(getAbsenceById(absence.id)).resolves.toEqual(absence);
    await expect(listAbsences()).resolves.toEqual([absenceListItem]);
    expect(requirePermission).toHaveBeenNthCalledWith(1, "absence:read");
    expect(requirePermission).toHaveBeenNthCalledWith(2, "absence:read");
    expect(findAbsenceById).toHaveBeenCalledWith(organizationId, absence.id);
    expect(findAbsences).toHaveBeenCalledWith(organizationId, { type: "all" }, {});
  });

  it("delegates uncovered filtering, limit, and OperationalContext to the read model", async () => {
    const context = {
      type: "contract" as const,
      clientId: "00000000-0000-4000-8000-000000000105",
      contractId: "00000000-0000-4000-8000-000000000106",
    };
    vi.mocked(findAbsences).mockResolvedValue({
      data: [absenceListItem],
      error: null,
    } as never);

    await expect(
      listAbsences(context, { withoutCoverage: true, limit: 3 }),
    ).resolves.toEqual([absenceListItem]);
    expect(findAbsences).toHaveBeenCalledWith(organizationId, context, {
      withoutCoverage: true,
      limit: 3,
    });
  });
});
