import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams("q=Maria&status=active"),
}));

import {
  hasActiveWorkerFilters,
  WORKER_SEARCH_DEBOUNCE_MS,
  WorkerFilterBar,
  WorkerTable,
  type WorkerWithCurrentAssignment,
} from "@/modules/workers";

describe("Workers list view", () => {
  it("renders removable filter chips and an accessible clear action", () => {
    const html = renderToStaticMarkup(
      createElement(
        WorkerFilterBar,
        null,
        createElement("div", null, "Resultados"),
      ),
    );

    expect(html).toContain('role="search"');
    expect(html).toContain('aria-label="Filtros de colaboradores"');
    expect(html).toContain('type="search"');
    expect(html).toContain('value="Maria"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain("Status: Ativo");
    expect(html).not.toContain("Aplicar");
    expect(html).not.toContain("<form");
    expect(html).toContain('aria-label="Filtros ativos"');
    expect(html).toContain("Busca: Maria");
    expect(html).toContain("Ativo");
    expect(html).toContain("Limpar filtros");
    expect(html).toContain('aria-label="Remover filtro de busca"');
    expect(html).toContain('aria-label="Remover filtro de status"');
    expect(html).toContain('aria-busy="false"');
    expect(html).toContain("Resultados");
    expect(WORKER_SEARCH_DEBOUNCE_MS).toBe(350);
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
    expect(html).toContain('title="Ver colaborador"');
    expect(html).toContain("lucide-chevron-right");
    expect(html).toContain("sm:hidden");
    expect(html).toContain("sm:min-w-[960px]");
  });
});
