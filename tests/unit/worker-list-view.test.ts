import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  hasActiveWorkerFilters,
  WorkerFilterBar,
  WorkerTable,
  type WorkerWithCurrentAssignment,
} from "@/modules/workers";

describe("Workers list view", () => {
  it("describes active filters and provides an accessible clear action", () => {
    const html = renderToStaticMarkup(
      createElement(WorkerFilterBar, {
        filters: { query: "Maria", status: "active" },
      }),
    );

    expect(html).toContain('aria-label="Filtros de colaboradores"');
    expect(html).toContain("Filtros ativos:");
    expect(html).toContain("Busca por “Maria”");
    expect(html).toContain("Status: Ativo");
    expect(html).toContain('aria-label="Limpar filtros de colaboradores"');
  });

  it("recognizes search and status as optional refinements", () => {
    expect(hasActiveWorkerFilters({ query: "", status: "all" })).toBe(false);
    expect(hasActiveWorkerFilters({ query: "Ana", status: "all" })).toBe(true);
    expect(hasActiveWorkerFilters({ query: "", status: "inactive" })).toBe(true);
  });

  it("keeps identification, status and the row action available on mobile", () => {
    const worker = {
      id: "00000000-0000-4000-8000-000000000001",
      full_name: "Maria da Silva",
      document_number: "12345678909",
      email: "maria@example.invalid",
      phone: null,
      status: "active",
      currentAssignment: null,
    } as WorkerWithCurrentAssignment;

    const html = renderToStaticMarkup(
      createElement(WorkerTable, { workers: [worker] }),
    );

    expect(html).toContain('aria-label="Tabela de colaboradores"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("Maria da Silva");
    expect(html).toContain("CPF 123.456.789-09");
    expect(html).toContain("maria@example.invalid");
    expect(html).toContain("Sem alocação");
    expect(html).toContain("Ativo");
    expect(html).toContain('aria-label="Ver detalhes de Maria da Silva"');
    expect(html).toContain("xl:hidden");
  });
});
