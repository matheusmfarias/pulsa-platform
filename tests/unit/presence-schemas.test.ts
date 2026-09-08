import { describe, expect, it } from "vitest";

import {
  cancelPresenceSchema,
  completePresenceSchema,
  correctPresenceSchema,
  startPresenceSchema,
} from "@/modules/presences";

const scheduleEntryId = "00000000-0000-4000-8000-000000000501";
const presenceId = "00000000-0000-4000-8000-000000000601";

describe("Presence schemas", () => {
  it("defaults manual source and normalizes its optional reference", () => {
    expect(
      startPresenceSchema.parse({
        schedule_entry_id: scheduleEntryId,
        arrived_at: "2026-09-10T11:00:00Z",
        idempotency_key: "arrival-1",
      }),
    ).toMatchObject({ source: "manual", source_reference: null });
  });

  it("requires a source reference for app and integration", () => {
    expect(() =>
      startPresenceSchema.parse({
        schedule_entry_id: scheduleEntryId,
        arrived_at: "2026-09-10T11:00:00Z",
        idempotency_key: "arrival-2",
        source: "integration",
      }),
    ).toThrowError("Informe a referência da origem externa.");
  });

  it("validates completion and correction intervals", () => {
    expect(
      completePresenceSchema.parse({
        presence_id: presenceId,
        departed_at: "2026-09-10T19:00:00Z",
        idempotency_key: "departure-1",
      }),
    ).toMatchObject({ presence_id: presenceId });

    expect(() =>
      correctPresenceSchema.parse({
        presence_id: presenceId,
        arrived_at: "2026-09-10T11:00:00Z",
        departed_at: "2026-09-10T10:00:00Z",
        reason: "Correção",
        idempotency_key: "correction-1",
      }),
    ).toThrowError("A saída deve ser posterior à chegada.");
  });

  it("requires reasons for correction and cancellation", () => {
    expect(() =>
      cancelPresenceSchema.parse({
        presence_id: presenceId,
        reason: " ",
        idempotency_key: "cancel-1",
      }),
    ).toThrowError("Informe a justificativa.");
  });
});

