import type { WorkerScheduleEntry } from "../domain/worker-schedule";

export function formatWorkerTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatWorkerDate(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatCompactWorkerDate(
  value: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatScheduleUpdate(entry: WorkerScheduleEntry): string {
  const value = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: entry.unitTimezone,
  }).format(new Date(entry.publishedAt));
  return `Esta escala foi atualizada em ${value}.`;
}

export function formatUnitLocation(entry: WorkerScheduleEntry): string | null {
  return [entry.unitAddress, entry.unitCity, entry.unitState]
    .filter(Boolean)
    .join(" · ") || null;
}
