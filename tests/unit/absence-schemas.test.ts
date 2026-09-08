import { describe, expect, it } from "vitest";

import {
  ABSENCE_REASON_LABELS,
  ABSENCE_STATUS_LABELS,
  createAbsenceSchema,
} from "@/modules/absences";

const scheduleEntryId = "00000000-0000-4000-8000-000000000501";

describe("Absence schemas", () => {
  it("accepts every V1 reason and exposes Portuguese labels", () => {
    for (const reason of [
      "sick",
      "medical_certificate",
      "personal",
      "no_show",
      "other",
    ] as const) {
      expect(
        createAbsenceSchema.parse({ schedule_entry_id: scheduleEntryId, reason }),
      ).toEqual({ schedule_entry_id: scheduleEntryId, reason, notes: null });
      expect(ABSENCE_REASON_LABELS[reason]).toBeTruthy();
    }
    expect(ABSENCE_STATUS_LABELS.reported).toBe("Registrada");
    expect(ABSENCE_STATUS_LABELS.cancelled).toBe("Cancelada");
  });

  it("normalizes blank notes and rejects reasons outside V1", () => {
    expect(
      createAbsenceSchema.parse({
        schedule_entry_id: scheduleEntryId,
        reason: "other",
        notes: "   ",
      }).notes,
    ).toBeNull();
    expect(() =>
      createAbsenceSchema.parse({
        schedule_entry_id: scheduleEntryId,
        reason: "vacation",
      }),
    ).toThrow();
  });
});
