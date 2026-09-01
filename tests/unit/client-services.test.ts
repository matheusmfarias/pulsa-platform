import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostgrestError } from "@supabase/supabase-js";

import { requireActiveOrganization } from "@/modules/organizations";
import type { Client } from "@/modules/clients";
import {
  findClientById,
  insertClient,
  updateClientStatus,
} from "@/modules/clients/repositories/client-repository";
import { deactivateClient } from "@/modules/clients/services/change-client-status";
import { createClient } from "@/modules/clients/services/create-client";

vi.mock("@/modules/organizations", () => ({
  requireActiveOrganization: vi.fn(),
}));

vi.mock("@/modules/clients/repositories/client-repository", () => ({
  findClientById: vi.fn(),
  insertClient: vi.fn(),
  updateClientStatus: vi.fn(),
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

const success = <T>(data: T) => ({
  success: true as const,
  data,
  error: null,
  count: null,
  status: 200,
  statusText: "OK",
});

const inactiveClient: Client = { ...client, status: "inactive" };

describe("client services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireActiveOrganization).mockResolvedValue({
      organizationId: client.organization_id,
      userId: "00000000-0000-4000-8000-000000000201",
      role: "DIRECTOR",
    });
  });

  it("deactivates an active client with an explicit transition", async () => {
    vi.mocked(findClientById).mockResolvedValue(success(client));
    vi.mocked(updateClientStatus).mockResolvedValue(
      success(inactiveClient),
    );

    await expect(deactivateClient(client.id)).resolves.toMatchObject({
      status: "inactive",
    });
    expect(updateClientStatus).toHaveBeenCalledWith(
      client.organization_id,
      client.id,
      "active",
      "inactive",
    );
  });

  it("returns a conflict when the requested status already exists", async () => {
    vi.mocked(findClientById).mockResolvedValue(
      success(inactiveClient),
    );

    await expect(deactivateClient(client.id)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(updateClientStatus).not.toHaveBeenCalled();
  });

  it("maps database document duplication to a safe conflict", async () => {
    vi.mocked(insertClient).mockResolvedValue({
      success: false,
      data: null,
      error: new PostgrestError({
        code: "23505",
        details: "",
        hint: "",
        message: "duplicate key value violates unique constraint",
      }),
      count: null,
      status: 409,
      statusText: "Conflict",
    });

    await expect(
      createClient({
        legal_name: client.legal_name,
        trade_name: client.trade_name,
        document_number: client.document_number,
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Já existe um cliente com este documento na organização.",
    });
  });
});
