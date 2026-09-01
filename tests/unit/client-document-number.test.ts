import { describe, expect, it } from "vitest";

import {
  formatDocumentNumber,
  isValidCnpj,
  normalizeDocumentNumber,
} from "@/modules/clients/domain/document-number";

describe("client document number", () => {
  it("normalizes punctuation before persistence", () => {
    expect(normalizeDocumentNumber("11.222.333/0001-81")).toBe("11222333000181");
  });

  it("validates CNPJ check digits", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
  });

  it("formats normalized values for display", () => {
    expect(formatDocumentNumber("11222333000181")).toBe("11.222.333/0001-81");
  });
});
