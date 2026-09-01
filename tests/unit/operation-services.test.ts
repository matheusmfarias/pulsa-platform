import { beforeEach, describe, expect, it, vi } from "vitest";

import { getContractById, type ContractWithClient } from "@/modules/contracts";
import { requireActiveOrganization } from "@/modules/organizations";
import type { Operation } from "@/modules/operations";
import { insertOperation } from "@/modules/operations/repositories/operation-repository";
import { createOperation } from "@/modules/operations/services/create-operation";
import { validateOperationManager } from "@/modules/operations/services/validate-manager";

vi.mock("@/modules/contracts", () => ({ getContractById: vi.fn() }));
vi.mock("@/modules/organizations", () => ({
  requireActiveOrganization: vi.fn(),
}));
vi.mock("@/modules/operations/repositories/operation-repository", () => ({
  insertOperation: vi.fn(),
}));
vi.mock("@/modules/operations/services/validate-manager", () => ({
  validateOperationManager: vi.fn(),
}));

const organizationId = "00000000-0000-4000-8000-000000000001";
const managerId = "00000000-0000-4000-8000-000000000401";
const contract: ContractWithClient = {
  id: "00000000-0000-4000-8000-000000000201",
  client_id: "00000000-0000-4000-8000-000000000101",
  name: "Contrato de Desenvolvimento",
  start_date: "2026-01-01",
  end_date: null,
  status: "active",
  external_reference: null,
  created_at: "2026-08-31T21:00:00.000Z",
  updated_at: "2026-08-31T21:00:00.000Z",
  client: {
    id: "00000000-0000-4000-8000-000000000101",
    trade_name: "Cliente Exemplo",
    status: "active",
  },
};

const operation: Operation = {
  id: "00000000-0000-4000-8000-000000000301",
  contract_id: contract.id,
  name: "Operação de Desenvolvimento",
  description: null,
  start_date: "2026-01-01",
  end_date: null,
  status: "planning",
  manager_user_id: managerId,
  created_at: "2026-08-31T23:00:00.000Z",
  updated_at: "2026-08-31T23:00:00.000Z",
};

const input = {
  contract_id: contract.id,
  name: operation.name,
  description: operation.description,
  start_date: operation.start_date,
  end_date: operation.end_date,
  manager_user_id: managerId,
};

const success = <T>(data: T) => ({
  success: true as const,
  data,
  error: null,
  count: null,
  status: 201,
  statusText: "Created",
});

describe("operation services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireActiveOrganization).mockResolvedValue({
      organizationId,
      userId: managerId,
      role: "DIRECTOR",
    });
  });

  it("creates a planning operation for an active contract", async () => {
    vi.mocked(getContractById).mockResolvedValue(contract);
    vi.mocked(insertOperation).mockResolvedValue(success(operation));

    await expect(createOperation(input)).resolves.toMatchObject({
      status: "planning",
    });
    expect(validateOperationManager).toHaveBeenCalledWith(
      organizationId,
      managerId,
    );
    expect(insertOperation).toHaveBeenCalledWith(input);
  });

  it.each(["draft", "suspended", "ended", "cancelled"] as const)(
    "rejects creation for a %s contract",
    async (status) => {
      vi.mocked(getContractById).mockResolvedValue({ ...contract, status });

      await expect(createOperation(input)).rejects.toMatchObject({
        code: "CONFLICT",
      });
      expect(insertOperation).not.toHaveBeenCalled();
    },
  );
});
