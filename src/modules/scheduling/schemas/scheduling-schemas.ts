import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");
const timestampSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Informe um horário UTC válido.",
);
const nullableTimestampSchema = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  timestampSchema.nullable(),
);

export const scheduleIdSchema = z.uuid("Escala inválida.");
export const scheduleRevisionIdSchema = z.uuid("Revisão de escala inválida.");
export const scheduleEntryIdSchema = z.uuid("Entrada de escala inválida.");

export const createScheduleSchema = z
  .object({
    organization_id: z.uuid("Organização inválida."),
    operation_id: z.uuid("Operação inválida."),
    period_start: dateSchema,
    period_end: dateSchema,
  })
  .refine((value) => value.period_end >= value.period_start, {
    path: ["period_end"],
    message: "O fim do período não pode anteceder o início.",
  });

const scheduleEntryFields = z.object({
  schedule_revision_id: scheduleRevisionIdSchema,
  assignment_id: z.uuid("Assignment inválida."),
  starts_at: timestampSchema,
  ends_at: timestampSchema,
  break_starts_at: nullableTimestampSchema,
  break_ends_at: nullableTimestampSchema,
});

function validateEntryTiming(
  value: {
    starts_at: string;
    ends_at: string;
    break_starts_at: string | null;
    break_ends_at: string | null;
  },
  context: z.RefinementCtx,
) {
  const starts = Date.parse(value.starts_at);
  const ends = Date.parse(value.ends_at);
  if (starts >= ends) {
    context.addIssue({ code: "custom", path: ["ends_at"], message: "O fim deve ser posterior ao início." });
  }
  const breaksArePaired = (value.break_starts_at === null) === (value.break_ends_at === null);
  if (!breaksArePaired) {
    context.addIssue({ code: "custom", path: ["break_ends_at"], message: "Informe ambos os horários de intervalo." });
  }
  if (value.break_starts_at && value.break_ends_at) {
    const breakStart = Date.parse(value.break_starts_at);
    const breakEnd = Date.parse(value.break_ends_at);
    if (!(starts < breakStart && breakStart < breakEnd && breakEnd < ends)) {
      context.addIssue({ code: "custom", path: ["break_starts_at"], message: "O intervalo deve estar estritamente dentro da entrada." });
    }
  }
}

export const scheduleEntryInputSchema = scheduleEntryFields.superRefine(validateEntryTiming);

export const updateScheduleEntrySchema = scheduleEntryFields
  .omit({ schedule_revision_id: true })
  .superRefine(validateEntryTiming);

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type ScheduleEntryInput = z.infer<typeof scheduleEntryInputSchema>;
export type UpdateScheduleEntryInput = z.infer<typeof updateScheduleEntrySchema>;
