import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WorkerHomeContent } from "@/modules/worker-schedule/components/worker-home-content";
import type { WorkerScheduleEntry } from "@/modules/worker-schedule/domain/worker-schedule";

function entry(
  id: string,
  startsAt: string,
  endsAt: string,
  journeyStatus: WorkerScheduleEntry["journeyStatus"],
): WorkerScheduleEntry {
  return {
    scheduleEntryId: id,
    startsAt,
    endsAt,
    breakStartsAt: null,
    breakEndsAt: null,
    localDate: "2026-09-23",
    operationName: "Operação Piloto",
    unitName: "Unidade Centro",
    unitTimezone: "America/Sao_Paulo",
    unitAddress: null,
    unitCity: null,
    unitState: null,
    jobRoleName: "Operador",
    journeyStatus,
    presenceStatus: null,
    arrivedAt: null,
    departedAt: null,
    scheduleVersion: 3,
    publishedAt: "2026-09-23T20:06:00Z",
    wasRepublished: true,
  };
}

describe("Worker home experience", () => {
  it("shows a second same-day journey when a covered journey is current", () => {
    const covered = entry(
      "covered",
      "2026-09-23T17:00:00Z",
      "2026-09-23T21:00:00Z",
      "original_replaced",
    );
    const later = entry(
      "later",
      "2026-09-23T22:00:00Z",
      "2026-09-23T23:00:00Z",
      "original_expected",
    );
    const html = renderToStaticMarkup(
      createElement(WorkerHomeContent, {
        home: { workerName: "Pessoa Teste", current: covered, today: later, next: null },
      }),
    );

    expect(html).toContain("Esta jornada foi coberta. Você não é esperado.");
    expect(html).toContain("Outra jornada hoje");
    expect(html).toContain("19:00 — 20:00");
    expect(html).toContain("Escalado");
    expect(html).toContain("/worker/schedule/later");
  });

  it("does not repeat the same journey in the second slot", () => {
    const current = entry(
      "current",
      "2026-09-23T17:00:00Z",
      "2026-09-23T21:00:00Z",
      "original_expected",
    );
    const html = renderToStaticMarkup(
      createElement(WorkerHomeContent, {
        home: { workerName: "Pessoa Teste", current, today: current, next: null },
      }),
    );

    expect(html).not.toContain("Outra jornada hoje");
  });
});
