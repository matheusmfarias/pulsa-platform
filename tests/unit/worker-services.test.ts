import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireActiveOrganization } from "@/modules/organizations";
import { insertWorker } from "@/modules/workers/repositories/worker-repository";
import { createWorker } from "@/modules/workers/services/create-worker";

vi.mock("@/modules/organizations", () => ({
  requireActiveOrganization: vi.fn(),
}));
vi.mock("@/modules/workers/repositories/worker-repository", () => ({
  insertWorker: vi.fn(),
}));

const organizationId = "00000000-0000-4000-8000-000000000001";
const input = {
  full_name: "Pessoa Fictícia",
  document_number: "529.982.247-25",
  email: null,
  phone: null,
  engagement_start_date: null,
  engagement_end_date: null,
};
const worker = {
  id: "00000000-0000-4000-8000-000000000601",
  organization_id: organizationId,
  ...input,
  document_number: "52998224725",
  status: "onboarding",
  created_at: "2026-09-01T03:00:00Z",
  updated_at: "2026-09-01T03:00:00Z",
};

describe("worker services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireActiveOrganization).mockResolvedValue({
      organizationId,
      userId: "00000000-0000-4000-8000-000000000701",
      role: "DIRECTOR",
    });
  });

  it("resolves organization server-side and creates onboarding worker", async () => {
    vi.mocked(insertWorker).mockResolvedValue({
      data: worker,
      error: null,
    } as never);

    await expect(createWorker(input)).resolves.toMatchObject({
      organization_id: organizationId,
      document_number: "52998224725",
      status: "onboarding",
    });
    expect(insertWorker).toHaveBeenCalledWith(
      organizationId,
      expect.not.objectContaining({ organization_id: expect.anything() }),
    );
  });

  it("maps duplicate CPF in the organization to a safe conflict", async () => {
    vi.mocked(insertWorker).mockResolvedValue({
      data: null,
      error: { code: "23505" },
    } as never);
    await expect(createWorker(input)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
