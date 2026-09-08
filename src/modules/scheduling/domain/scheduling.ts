import { z } from "zod";

export const scheduleRevisionStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "published",
]);
export type ScheduleRevisionStatus = z.infer<typeof scheduleRevisionStatusSchema>;

export const scheduleSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  operation_id: z.uuid(),
  period_start: z.string(),
  period_end: z.string(),
  created_at: z.string(),
  created_by: z.uuid(),
});

export const scheduleRevisionSchema = z.object({
  id: z.uuid(),
  schedule_id: z.uuid(),
  version: z.number().int().positive(),
  status: scheduleRevisionStatusSchema,
  based_on_revision_id: z.uuid().nullable(),
  created_at: z.string(),
  created_by: z.uuid(),
  submitted_at: z.string().nullable(),
  submitted_by: z.uuid().nullable(),
  approved_at: z.string().nullable(),
  approved_by: z.uuid().nullable(),
  published_at: z.string().nullable(),
  published_by: z.uuid().nullable(),
});

export const scheduleEntrySchema = z.object({
  id: z.uuid(),
  schedule_revision_id: z.uuid(),
  assignment_id: z.uuid(),
  starts_at: z.string(),
  ends_at: z.string(),
  break_starts_at: z.string().nullable(),
  break_ends_at: z.string().nullable(),
  created_at: z.string(),
  created_by: z.uuid(),
});

export const scheduleEntryWithContextSchema = scheduleEntrySchema.extend({
  absences: z
    .array(
      z.object({
        id: z.uuid(),
        reason: z.enum([
          "sick",
          "medical_certificate",
          "personal",
          "no_show",
          "other",
        ]),
        status: z.enum(["reported", "cancelled"]),
        replacements: z.array(z.object({
          id: z.uuid(),
          status: z.enum(["active", "cancelled"]),
          replacement_assignment_id: z.uuid(),
          replacement_assignment: z.object({ worker: z.object({ id: z.uuid(), full_name: z.string() }) }),
        })).optional(),
      }),
    )
    .optional(),
  assignment: z.object({
    id: z.uuid(),
    worker_id: z.uuid(),
    position_id: z.uuid(),
    start_date: z.string(),
    end_date: z.string().nullable(),
    status: z.string(),
    worker: z.object({ id: z.uuid(), full_name: z.string(), status: z.string() }),
    position: z.object({
      id: z.uuid(),
      status: z.string(),
      job_role: z.object({ id: z.uuid(), name: z.string() }),
      unit: z.object({
        id: z.uuid(),
        name: z.string(),
        timezone: z.string(),
        operation: z.object({ id: z.uuid(), name: z.string() }),
      }),
    }),
  }),
});

export const scheduleRevisionWithEntriesSchema = scheduleRevisionSchema.extend({
  schedule: scheduleSchema,
  entries: z.array(scheduleEntryWithContextSchema),
});

export type Schedule = z.infer<typeof scheduleSchema>;
export type ScheduleRevision = z.infer<typeof scheduleRevisionSchema>;
export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;
export type ScheduleEntryWithContext = z.infer<typeof scheduleEntryWithContextSchema>;

export function activeAbsenceForScheduleEntry(entry: ScheduleEntryWithContext) {
  return entry.absences?.find((absence) => absence.status === "reported") ?? null;
}

export function activeReplacementForAbsence(
  absence: NonNullable<ReturnType<typeof activeAbsenceForScheduleEntry>>,
) {
  return absence.replacements?.find((replacement) => replacement.status === "active") ?? null;
}

export type ScheduleRevisionWithEntries = z.infer<typeof scheduleRevisionWithEntriesSchema>;

export const SCHEDULE_REVISION_STATUS_LABELS: Record<ScheduleRevisionStatus, string> = {
  draft: "Rascunho",
  pending_approval: "Aguardando aprovação",
  approved: "Aprovada",
  published: "Publicada",
};

export type ScheduleOverview = Schedule & {
  operation: { id: string; name: string };
  latestRevision: ScheduleRevision | null;
};

export function selectScheduleWorkRevision(
  revisions: ScheduleRevision[],
): ScheduleRevision | null {
  const workingRevision = revisions.find((revision) =>
    ["draft", "pending_approval", "approved"].includes(revision.status),
  );
  return workingRevision ?? revisions.find((revision) => revision.status === "published") ?? null;
}

export function selectScheduleRevision(
  revisions: ScheduleRevision[],
  requestedRevisionId?: string,
) {
  return revisions.find((revision) => revision.id === requestedRevisionId) ??
    selectScheduleWorkRevision(revisions);
}

export function selectOfficialPublishedRevision(revisions: ScheduleRevision[]) {
  return revisions
    .filter((revision) => revision.status === "published")
    .sort((left, right) => right.version - left.version)[0] ?? null;
}

export function canRegisterAbsenceOnRevision(
  hasPermission: boolean,
  revision: ScheduleRevision | null,
  revisions: ScheduleRevision[],
) {
  return hasPermission && revision?.id === selectOfficialPublishedRevision(revisions)?.id;
}
