import { beforeEach, describe, expect, it, vi } from "vitest";

import { requirePermission } from "@/modules/authorization";
import { cancelReplacement, createReplacement, listReplacementCandidates } from "@/modules/replacements";
import { cancelReplacementRecord, findReplacementCandidates, insertReplacement } from "@/modules/replacements/repositories/replacement-repository";

vi.mock("@/modules/authorization", () => ({ requirePermission: vi.fn() }));
vi.mock("@/modules/replacements/repositories/replacement-repository", () => ({
  cancelReplacementRecord: vi.fn(), findReplacementCandidates: vi.fn(), insertReplacement: vi.fn(),
}));

const organizationId = "00000000-0000-4000-8000-000000000001";
const absenceId = "00000000-0000-4000-8000-000000000601";
const assignmentId = "00000000-0000-4000-8000-000000000301";
const replacement = { id: "00000000-0000-4000-8000-000000000801", organization_id: organizationId, absence_id: absenceId, replacement_assignment_id: assignmentId, status: "active", created_at: "2026-09-08T12:00:00Z", created_by: "00000000-0000-4000-8000-000000000701", cancelled_at: null, cancelled_by: null };

describe("Replacement services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue({ organizationId, userId: replacement.created_by, role: "DIRECTOR" });
  });

  it("creates a replacement through the protected RPC", async () => {
    vi.mocked(insertReplacement).mockResolvedValue({ data: replacement, error: null } as never);
    await expect(createReplacement({ absence_id: absenceId, assignment_id: assignmentId })).resolves.toEqual(replacement);
    expect(requirePermission).toHaveBeenCalledWith("replacement:create");
    expect(insertReplacement).toHaveBeenCalledWith(organizationId, absenceId, assignmentId);
  });

  it("maps a second active replacement and conflicts to safe errors", async () => {
    vi.mocked(insertReplacement).mockResolvedValue({ data: null, error: { code: "23505", message: "replacements_one_active_per_absence_idx" } } as never);
    await expect(createReplacement({ absence_id: absenceId, assignment_id: assignmentId })).rejects.toMatchObject({ code: "CONFLICT" });
    vi.mocked(insertReplacement).mockResolvedValue({ data: null, error: { code: "23P01", message: "Schedule worker conflict" } } as never);
    await expect(createReplacement({ absence_id: absenceId, assignment_id: assignmentId })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("cancels through the protected RPC and reads candidates with create permission", async () => {
    vi.mocked(cancelReplacementRecord).mockResolvedValue({ data: { ...replacement, status: "cancelled", cancelled_at: "2026-09-08T13:00:00Z", cancelled_by: replacement.created_by }, error: null } as never);
    vi.mocked(findReplacementCandidates).mockResolvedValue({ data: [{ assignment_id: assignmentId, worker_id: "00000000-0000-4000-8000-000000000201", worker_full_name: "João Silva" }], error: null } as never);
    await expect(cancelReplacement(replacement.id)).resolves.toMatchObject({ status: "cancelled" });
    await expect(listReplacementCandidates(absenceId)).resolves.toHaveLength(1);
    expect(requirePermission).toHaveBeenNthCalledWith(1, "replacement:cancel");
    expect(requirePermission).toHaveBeenNthCalledWith(2, "replacement:create");
  });
});
