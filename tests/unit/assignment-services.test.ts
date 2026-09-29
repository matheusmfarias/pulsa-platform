import { beforeEach, describe, expect, it, vi } from "vitest";

import { requirePermission } from "@/modules/authorization";
import { findAssignmentsPage, insertAssignment } from "@/modules/assignments/repositories/assignment-repository";
import { createAssignment } from "@/modules/assignments/services/create-assignment";
import { listAssignmentsPage } from "@/modules/assignments/services/list-assignments";
import { validateAssignmentParents } from "@/modules/assignments/services/validate-assignment-parents";

vi.mock("@/modules/authorization", () => ({ requirePermission: vi.fn() }));
vi.mock("@/modules/assignments/repositories/assignment-repository", () => ({
  insertAssignment: vi.fn(),
  findAssignmentsPage: vi.fn(),
}));
vi.mock("@/modules/assignments/services/validate-assignment-parents", () => ({
  validateAssignmentParents: vi.fn(),
}));

const input = {
  worker_id: "00000000-0000-4000-8000-000000000101",
  position_id: "00000000-0000-4000-8000-000000000201",
  start_date: "2026-09-01",
  end_date: null,
};

const parents = {
  worker: { id: input.worker_id, status: "active", organization_id: "org-1" },
  position: {
    id: input.position_id,
    status: "active",
    unit: { operation: { contract: { client: { organization_id: "org-1" } } } },
  },
};

describe("createAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue({
      organizationId: "00000000-0000-4000-8000-000000000001",
      userId: "00000000-0000-4000-8000-000000000701",
      role: "DIRECTOR",
    });
    vi.mocked(validateAssignmentParents).mockResolvedValue(parents);
  });

  it("requires assignment:create and persists a compatible relation", async () => {
    vi.mocked(insertAssignment).mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000301",
        ...input,
        status: "pending",
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
      },
      error: null,
      count: null,
      status: 200,
      statusText: "OK",
      success: true,
    });
    await expect(createAssignment(input)).resolves.toMatchObject({ status: "pending" });
    expect(requirePermission).toHaveBeenCalledWith("assignment:create");
    expect(insertAssignment).toHaveBeenCalledWith(input);
  });

  it("rejects an incompatible Worker", async () => {
    vi.mocked(validateAssignmentParents).mockResolvedValue({
      ...parents,
      worker: { ...parents.worker, status: "onboarding" },
    });
    await expect(createAssignment(input)).rejects.toMatchObject({ code: "VALIDATION" });
    expect(insertAssignment).not.toHaveBeenCalled();
  });

  it("rejects an inactive Position", async () => {
    vi.mocked(validateAssignmentParents).mockResolvedValue({
      ...parents,
      position: { ...parents.position, status: "inactive" },
    });
    await expect(createAssignment(input)).rejects.toMatchObject({ code: "VALIDATION" });
    expect(insertAssignment).not.toHaveBeenCalled();
  });
});

describe("listAssignmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue({
      organizationId: "00000000-0000-4000-8000-000000000001",
      userId: "00000000-0000-4000-8000-000000000701",
      role: "DIRECTOR",
    });
  });

  it("returns an exact total while fetching only one 50-row page", async () => {
    vi.mocked(findAssignmentsPage).mockResolvedValue({ data: [], error: null, count: 125, status: 200, statusText: "OK", success: true });

    await expect(listAssignmentsPage({ status: "active" }, undefined, 2)).resolves.toMatchObject({
      items: [], page: 2, pageSize: 50, total: 125, pageCount: 3,
    });
    expect(requirePermission).toHaveBeenCalledWith("assignment:read");
    expect(findAssignmentsPage).toHaveBeenCalledWith({ status: "active" }, expect.anything(), 2, 50);
  });

  it("moves a stale page request back to the last page", async () => {
    vi.mocked(findAssignmentsPage)
      .mockResolvedValueOnce({ data: [], error: null, count: 75, status: 200, statusText: "OK", success: true })
      .mockResolvedValueOnce({ data: [], error: null, count: 75, status: 200, statusText: "OK", success: true });

    await expect(listAssignmentsPage({}, undefined, 9)).resolves.toMatchObject({ page: 2, total: 75, pageCount: 2 });
    expect(findAssignmentsPage).toHaveBeenNthCalledWith(2, {}, expect.anything(), 2, 50);
  });
});
