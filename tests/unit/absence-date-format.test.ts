import { describe, expect, it } from "vitest";

import { formatAbsenceJourney } from "@/modules/absences/components/absence-date-format";

describe("absence journey date", () => {
  it("shows one date for a journey within the same local day", () => {
    expect(formatAbsenceJourney(
      "2026-09-23T17:00:00Z",
      "2026-09-23T21:00:00Z",
      "America/Sao_Paulo",
    )).toBe("23/09/2026 · 14:00–18:00");
  });

  it("shows both local dates for an overnight journey", () => {
    expect(formatAbsenceJourney(
      "2026-09-24T01:00:00Z",
      "2026-09-24T05:00:00Z",
      "America/Sao_Paulo",
    )).toBe("23/09/2026, 22:00 – 24/09/2026, 02:00");
  });
});
