import { describe, expect, it, vi } from "vitest";

import { findAssignmentParents } from "@/modules/assignments/repositories/assignment-repository";
import { validateAssignmentParents } from "@/modules/assignments/services/validate-assignment-parents";

vi.mock("@/modules/assignments/repositories/assignment-repository", () => ({
  findAssignmentParents: vi.fn(),
}));

describe("validateAssignmentParents", () => {
  it("rejects Worker and Position from different organizations", async () => {
    vi.mocked(findAssignmentParents).mockResolvedValue({
      worker: {
        data: { id: "worker", status: "active", organization_id: "org-a" },
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
        success: true,
      },
      position: {
        data: {
          id: "position",
          status: "active",
          unit: { operation: { contract: { client: { organization_id: "org-b" } } } },
        },
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
        success: true,
      },
    });
    await expect(validateAssignmentParents("worker", "position")).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });
});
