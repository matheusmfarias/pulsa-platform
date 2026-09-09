import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

describe("Worker Presence UI", () => {
  it("uses the same server-derived CTA on Home and detail", () => {
    const home = source("src/app/(worker-authenticated)/worker/page.tsx");
    const detail = source(
      "src/app/(worker-authenticated)/worker/schedule/[entryId]/page.tsx",
    );
    const control = source(
      "src/modules/worker-presence/components/worker-presence-action.tsx",
    );
    expect(home).toContain("getWorkerPresenceAction");
    expect(detail).toContain("getWorkerPresenceAction");
    expect(home).toContain("WorkerPresenceControl");
    expect(detail).toContain("WorkerPresenceControl");
    expect(control).toContain("Registrar chegada");
    expect(control).toContain("Registrar saída");
  });

  it("keeps UUID retry keys stable until a terminal refresh", () => {
    const control = source(
      "src/modules/worker-presence/components/worker-presence-action.tsx",
    );
    expect(control).toContain("useRef<string | null>(null)");
    expect(control).toContain("idempotencyKey.current ??= globalThis.crypto.randomUUID()");
    expect(control).toContain("sourceReference.current ??= globalThis.crypto.randomUUID()");
    expect(control).not.toContain("new Date(");
    expect(control).not.toContain("organizationId");
    expect(control).not.toContain("workerId");
  });

  it("adds a private Worker history route with objective signals only", () => {
    const navigation = source(
      "src/modules/worker-schedule/components/worker-navigation.tsx",
    );
    const page = source(
      "src/app/(worker-authenticated)/worker/history/page.tsx",
    );
    const history = source(
      "src/modules/worker-presence/components/worker-presence-history.tsx",
    );
    expect(navigation).toContain('/worker/history');
    expect(page).toContain("listWorkerPresenceHistory");
    expect(history).toContain("Planejado");
    expect(history).toContain("Realizado");
    expect(history).toContain("Chegada após o início previsto.");
    expect(history).toContain("Saída antes do fim previsto.");
    expect(`${page}${history}`).not.toContain("OperationalContext");
    expect(`${page}${history}`).not.toContain("workerId");
  });

  it("revalidates every Worker Presence projection after successful mutation", () => {
    const actions = source("src/modules/worker-presence/actions.ts");
    for (const path of [
      'revalidatePath("/worker")',
      'revalidatePath("/worker/schedule")',
      'revalidatePath("/worker/history")',
    ]) {
      expect(actions).toContain(path);
    }
    expect(actions).toContain("workerStartPresenceAction");
    expect(actions).toContain("workerCompletePresenceAction");
  });
});
