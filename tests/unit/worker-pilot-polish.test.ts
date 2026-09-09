import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getWorkerClaimExperience } from "@/modules/worker-access/domain/worker-access";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

describe("Pulsa Worker pilot polish", () => {
  it("provides four Worker destinations with mobile safe-area protection", () => {
    const navigation = source(
      "src/modules/worker-schedule/components/worker-navigation.tsx",
    );
    const layout = source("src/app/(worker-authenticated)/worker/layout.tsx");

    for (const destination of [
      '{ href: "/worker", label: "Hoje"',
      '{ href: "/worker/schedule", label: "Escala"',
      '{ href: "/worker/history", label: "Histórico"',
      '{ href: "/worker/account", label: "Conta"',
    ]) {
      expect(navigation).toContain(destination);
    }
    expect(navigation).toContain("aria-current");
    expect(navigation).toContain("safe-area-inset-bottom");
    expect(layout).toContain("safe-area-inset-bottom");
  });

  it("keeps account and logout inside the authenticated Worker boundary", () => {
    const layout = source("src/app/(worker-authenticated)/worker/layout.tsx");
    const account = source(
      "src/app/(worker-authenticated)/worker/account/page.tsx",
    );
    const actions = source("src/modules/worker-access/actions.ts");

    expect(layout).toContain("requireWorkerAccess()");
    expect(account).toContain("requireWorkerAccess()");
    expect(account).toContain("workerLogoutAction");
    expect(account).toContain("Acesso ativo");
    expect(account).not.toMatch(/Organization ID|Worker ID|permissions|memberships/i);
    expect(actions).toContain("await signOut()");
    expect(actions).toContain('redirect("/worker/sign-in")');
  });

  it("uses collaborator-facing sign-in and claim copy", () => {
    const signInPage = source(
      "src/app/(worker-public)/worker/sign-in/page.tsx",
    );
    const signInForm = source(
      "src/modules/worker-access/components/worker-sign-in-form.tsx",
    );
    const claimPage = source("src/app/(worker-public)/worker/claim/page.tsx");
    const initialClaim = getWorkerClaimExperience(false);

    expect(signInPage).toContain("Acesse sua conta");
    expect(signInPage).not.toContain("Este login não cria contas");
    expect(signInForm).toContain("Código de acesso");
    expect(signInForm).toContain("Enviar novo código");
    expect(initialClaim.title).toBe("Confirme seu acesso");
    expect(initialClaim.submitLabel).toBe("Ativar meu acesso");
    expect(claimPage).toContain("Este acesso será vinculado a:");
    expect(claimPage).not.toContain("Nenhum identificador");
  });

  it("keeps direct Presence feedback and remounts the form per action", () => {
    const control = source(
      "src/modules/worker-presence/components/worker-presence-action.tsx",
    );

    for (const message of [
      "Registrando chegada…",
      "Registrando saída…",
      "Chegada registrada.",
      "Saída registrada.",
    ]) {
      expect(control).toContain(message);
    }
    expect(control).toContain("aria-live=\"polite\"");
    expect(control).toContain("key={`${scheduleEntryId}:${action}`}");
  });

  it("hides the technical timezone and uses the standardized empty states", () => {
    const detail = source(
      "src/modules/worker-schedule/components/worker-schedule-entry-detail.tsx",
    );
    const home = source(
      "src/modules/worker-schedule/components/worker-home-content.tsx",
    );
    const schedule = source(
      "src/modules/worker-schedule/components/worker-schedule-list.tsx",
    );
    const history = source(
      "src/modules/worker-presence/components/worker-presence-history.tsx",
    );

    expect(detail).not.toContain('label="Fuso horário"');
    expect(detail).toContain("entry.unitTimezone");
    expect(home).toContain("Nenhuma jornada programada para hoje.");
    expect(schedule).toContain("Nenhuma jornada nesta semana.");
    expect(history).toContain("Você ainda não possui jornadas realizadas.");
  });
});
