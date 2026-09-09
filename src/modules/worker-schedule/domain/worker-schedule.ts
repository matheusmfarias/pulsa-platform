export const WORKER_JOURNEY_STATUSES = [
  "original_expected",
  "replacement_expected",
  "original_absent",
  "original_replaced",
  "completed",
  "in_progress",
] as const;

export type WorkerJourneyStatus =
  (typeof WORKER_JOURNEY_STATUSES)[number];

export type WorkerScheduleEntry = {
  scheduleEntryId: string;
  startsAt: string;
  endsAt: string;
  breakStartsAt: string | null;
  breakEndsAt: string | null;
  localDate: string;
  operationName: string;
  unitName: string;
  unitTimezone: string;
  unitAddress: string | null;
  unitCity: string | null;
  unitState: string | null;
  jobRoleName: string;
  journeyStatus: WorkerJourneyStatus;
  presenceStatus: "present" | "completed" | null;
  arrivedAt: string | null;
  departedAt: string | null;
  scheduleVersion: number;
  publishedAt: string;
  wasRepublished: boolean;
};

export type WorkerHome = {
  workerName: string;
  current: WorkerScheduleEntry | null;
  today: WorkerScheduleEntry | null;
  next: WorkerScheduleEntry | null;
};

export function addCivilDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const WORKER_JOURNEY_LABELS: Record<WorkerJourneyStatus, string> = {
  original_expected: "Você está escalado para esta jornada.",
  replacement_expected: "Você está cobrindo esta jornada.",
  original_absent: "Você não é esperado nesta jornada.",
  original_replaced: "Esta jornada foi coberta. Você não é esperado.",
  in_progress: "Jornada em andamento.",
  completed: "Jornada concluída.",
};

export const WORKER_JOURNEY_SHORT_LABELS: Record<WorkerJourneyStatus, string> = {
  original_expected: "Escalado",
  replacement_expected: "Substituição",
  original_absent: "Ausência registrada",
  original_replaced: "Jornada substituída",
  in_progress: "Em andamento",
  completed: "Concluída",
};
