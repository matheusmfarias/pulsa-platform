import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageHeader } from "@/components/layout/page";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

describe("design system foundation", () => {
  it("connects a field label, description and error to its control", () => {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        {
          id: "full_name",
          label: "Nome completo",
          description: "Como aparece nos documentos.",
          error: ["Informe o nome."],
          required: true,
        } as ComponentProps<typeof Field>,
        createElement(Input, { name: "full_name" }),
      ),
    );

    expect(html).toContain('for="full_name"');
    expect(html).toContain('id="full_name"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain(
      'aria-describedby="full_name-description full_name-error"',
    );
    expect(html).toContain('id="full_name-error"');
  });

  it("keeps the internal status separate from its localized presentation", () => {
    const html = renderToStaticMarkup(
      createElement(StatusBadge, {
        category: "warning",
        label: "Suspensa",
        status: "suspended",
      }),
    );

    expect(html).toContain('data-status="suspended"');
    expect(html).toContain("Suspensa");
    expect(html).toContain("text-status-warning-foreground");
  });

  it("uses alert semantics only for dangerous feedback by default", () => {
    const danger = renderToStaticMarkup(
      createElement(FeedbackMessage, { variant: "danger" }, "Falha ao salvar"),
    );
    const success = renderToStaticMarkup(
      createElement(FeedbackMessage, { variant: "success" }, "Alteração salva"),
    );

    expect(danger).toContain('role="alert"');
    expect(success).toContain('role="status"');
  });

  it("renders page hierarchy and action slots without repeating structure", () => {
    const html = renderToStaticMarkup(
      createElement(PageHeader, {
        eyebrow: "Pessoas",
        title: "Colaboradores",
        description: "Cadastro e situação operacional.",
        actions: createElement("button", null, "Novo colaborador"),
      }),
    );

    expect(html).toContain("<h1");
    expect(html).toContain("Pessoas");
    expect(html).toContain("Cadastro e situação operacional.");
    expect(html).toContain("Novo colaborador");
  });
});
