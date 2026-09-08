import type { AssignmentWithContext } from "@/modules/assignments";

import type { ScheduleEntryWithContext } from "./scheduling";
import type { ScheduleRevisionStatus } from "./scheduling";

export type ScheduleWeekDay = { key: string; label: string };
export type SchedulePositionGroup = {
  unit: { id: string; name: string; timezone: string };
  position: { id: string; name: string };
  assignments: AssignmentWithContext[];
  entriesByDay: Record<string, ScheduleEntryWithContext[]>;
};

function parseCivilDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function civilDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function startOfScheduleWeek(value: string) {
  const date = parseCivilDate(value);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return civilDate(date);
}

export function scheduleWeekDays(weekStart: string): ScheduleWeekDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = parseCivilDate(weekStart);
    date.setUTCDate(date.getUTCDate() + index);
    return { key: civilDate(date), label: new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date) };
  });
}

export function resolveScheduleWeekStart(periodStart: string, periodEnd: string, requested?: string) {
  const initial = startOfScheduleWeek(periodStart);
  if (!requested || !/^\d{4}-\d{2}-\d{2}$/.test(requested)) return initial;
  const candidate = startOfScheduleWeek(requested);
  return candidate < initial || candidate > periodEnd ? initial : candidate;
}

export function zonedCivilDateTime(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}` };
}

export function localDateTimeToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const intended = Date.UTC(year, month - 1, day, hour, minute);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(new Date(intended)).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = offset.match(/GMT([+-])(\d{2}):(\d{2})/);
  const offsetMinutes = match ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === "+" ? 1 : -1) : 0;
  return new Date(intended - offsetMinutes * 60_000).toISOString();
}

export function isScheduleRevisionEditable(status: ScheduleRevisionStatus) {
  return status === "draft";
}

export function eligibleAssignmentsForDate(assignments: AssignmentWithContext[], date: string) {
  return assignments.filter((assignment) => ["pending", "active"].includes(assignment.status) && assignment.start_date <= date && (!assignment.end_date || assignment.end_date >= date));
}

export function buildSchedulePositionGroups(entries: ScheduleEntryWithContext[], assignments: AssignmentWithContext[], weekStart: string) {
  const weekDays = new Set(scheduleWeekDays(weekStart).map((day) => day.key));
  const groups = new Map<string, SchedulePositionGroup>();
  for (const assignment of assignments.filter((item) => ["pending", "active"].includes(item.status))) {
    const { position } = assignment;
    if (!groups.has(position.id)) groups.set(position.id, { unit: { id: position.unit.id, name: position.unit.name, timezone: position.unit.timezone }, position: { id: position.id, name: position.job_role.name }, assignments: [], entriesByDay: {} });
    groups.get(position.id)?.assignments.push(assignment);
  }
  for (const entry of entries) {
    const timeZone = entry.assignment.position.unit.timezone;
    const day = zonedCivilDateTime(entry.starts_at, timeZone).date;
    if (!weekDays.has(day)) continue;
    const position = entry.assignment.position;
    if (!groups.has(position.id)) groups.set(position.id, { unit: { id: position.unit.id, name: position.unit.name, timezone: timeZone }, position: { id: position.id, name: position.job_role.name }, assignments: [], entriesByDay: {} });
    const group = groups.get(position.id)!;
    (group.entriesByDay[day] ??= []).push(entry);
  }
  return [...groups.values()].sort((left, right) => left.unit.name.localeCompare(right.unit.name) || left.position.name.localeCompare(right.position.name));
}
