import { beforeEach, describe, expect, it, vi } from "vitest";

import { getClientById, type Client } from "@/modules/clients";
import type { Contract } from "@/modules/contracts";
import { insertContract } from "@/modules/contracts/repositories/contract-repository";
import { createContract } from "@/modules/contracts/services/create-contract";

vi.mock("@/modules/clients", () => ({
  getClientById: vi.fn(),
}));
vi.mock("@/modules/authorization", () => ({
  requirePermission: vi.fn().mockResolvedValue({
    organizationId: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000701",
    role: "DIRECTOR",
  }),
}));

vi.mock("@/modules/contracts/repositories/contract-repository", () => ({
  insertContract: vi.fn(),
}));

const client: Client = {
  id: "00000000-0000-4000-8000-000000000101",
  organization_id: "00000000-0000-4000-8000-000000000001",
  legal_name: "Pulsa Teste Cliente Ltda.",
  trade_name: "Cliente Exemplo",
  document_number: "11222333000181",
  status: "active",
  created_at: "2026-08-31T19:00:00.000Z",
  updated_at: "2026-08-31T19:00:00.000Z",
};

const contract: Contract = {
  id: "00000000-0000-4000-8000-000000000201",
  client_id: client.id,
  name: "Contrato de Desenvolvimento",
  start_date: "2026-01-01",
  end_date: null,
  status: "draft",
  external_reference: null,
  created_at: "2026-08-31T21:00:00.000Z",
  updated_at: "2026-08-31T21:00:00.000Z",
};

const input = {
  client_id: client.id,
  name: contract.name,
  start_date: contract.start_date,
  end_date: contract.end_date,
  external_reference: contract.external_reference,
};

const success = <T>(data: T) => ({
  success: true as const,
  data,
  error: null,
  count: null,
  status: 201,
  statusText: "Created",
});

describe("contract services", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a draft contract for an active client", async () => {
    vi.mocked(getClientById).mockResolvedValue(client);
    vi.mocked(insertContract).mockResolvedValue(success(contract));

    await expect(createContract(input)).resolves.toMatchObject({ status: "draft" });
    expect(insertContract).toHaveBeenCalledWith(input);
  });

  it("rejects creation for an inactive client", async () => {
    vi.mocked(getClientById).mockResolvedValue({ ...client, status: "inactive" });

    await expect(createContract(input)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Não é possível criar contrato para um cliente inativo.",
    });
    expect(insertContract).not.toHaveBeenCalled();
  });
});
