import { describe, expect, it } from "vitest";

import {
  clientIdSchema,
  clientInputSchema,
  clientListFiltersSchema,
} from "@/modules/clients";

describe("client schemas", () => {
  it("trims names and normalizes the document", () => {
    const result = clientInputSchema.parse({
      legal_name: "  Pulsa Teste Cliente Ltda. ",
      trade_name: " Cliente Exemplo ",
      document_number: "11.222.333/0001-81",
    });

    expect(result).toEqual({
      legal_name: "Pulsa Teste Cliente Ltda.",
      trade_name: "Cliente Exemplo",
      document_number: "11222333000181",
    });
  });

  it("rejects an invalid document", () => {
    const result = clientInputSchema.safeParse({
      legal_name: "Empresa Teste Ltda.",
      trade_name: "Empresa Teste",
      document_number: "12.345.678/0001-90",
    });

    expect(result.success).toBe(false);
  });

  it("validates route ids and safely defaults invalid filters", () => {
    expect(clientIdSchema.safeParse("not-an-id").success).toBe(false);
    expect(clientListFiltersSchema.parse({ query: undefined, status: "deleted" })).toEqual({
      query: "",
      status: "all",
    });
  });
});
