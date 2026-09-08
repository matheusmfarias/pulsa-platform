import type { ScheduleEntryWithContext } from "../domain/scheduling";
import { localDateTimeToUtc, zonedCivilDateTime } from "../domain/weekly-schedule";

function addCivilDays(value: string, offset: number) { const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10); }
function civilDayOffset(from: string, to: string) { return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000); }
function eligible(entry: ScheduleEntryWithContext, date: string) { const assignment = entry.assignment; return ["pending", "active"].includes(assignment.status) && assignment.start_date <= date && (!assignment.end_date || assignment.end_date >= date); }

export function copyScheduleEntriesToPeriod(entries: ScheduleEntryWithContext[], sourcePeriodStart: string, targetPeriodStart: string, targetPeriodEnd: string) {
  const offset = civilDayOffset(sourcePeriodStart, targetPeriodStart); const copied: Array<{ assignment_id: string; starts_at: string; ends_at: string; break_starts_at: string | null; break_ends_at: string | null }> = []; let skipped = 0;
  for (const entry of entries) {
    const timeZone = entry.assignment.position.unit.timezone; const start = zonedCivilDateTime(entry.starts_at, timeZone); const end = zonedCivilDateTime(entry.ends_at, timeZone); const startDate = addCivilDays(start.date, offset); const endDate = addCivilDays(end.date, offset);
    if (startDate < targetPeriodStart || endDate > targetPeriodEnd || !eligible(entry, startDate)) { skipped += 1; continue; }
    const breakStart = entry.break_starts_at ? zonedCivilDateTime(entry.break_starts_at, timeZone) : null; const breakEnd = entry.break_ends_at ? zonedCivilDateTime(entry.break_ends_at, timeZone) : null;
    copied.push({ assignment_id: entry.assignment_id, starts_at: localDateTimeToUtc(startDate, start.time, timeZone), ends_at: localDateTimeToUtc(endDate, end.time, timeZone), break_starts_at: breakStart ? localDateTimeToUtc(addCivilDays(breakStart.date, offset), breakStart.time, timeZone) : null, break_ends_at: breakEnd ? localDateTimeToUtc(addCivilDays(breakEnd.date, offset), breakEnd.time, timeZone) : null });
  } return { copied, skipped };
}

export function copyScheduleEntryToDays(entry: ScheduleEntryWithContext, dates: string[], periodStart: string, periodEnd: string) {
  const timeZone = entry.assignment.position.unit.timezone; const start = zonedCivilDateTime(entry.starts_at, timeZone); const end = zonedCivilDateTime(entry.ends_at, timeZone); const breakStart = entry.break_starts_at ? zonedCivilDateTime(entry.break_starts_at, timeZone) : null; const breakEnd = entry.break_ends_at ? zonedCivilDateTime(entry.break_ends_at, timeZone) : null;
  const copied: Array<{ assignment_id: string; starts_at: string; ends_at: string; break_starts_at: string | null; break_ends_at: string | null }> = []; let skipped = 0;
  for (const date of [...new Set(dates)].filter((date) => date !== start.date)) {
    if (date < periodStart || date > periodEnd || !eligible(entry, date)) { skipped += 1; continue; }
    copied.push({ assignment_id: entry.assignment_id, starts_at: localDateTimeToUtc(date, start.time, timeZone), ends_at: localDateTimeToUtc(date, end.time, timeZone), break_starts_at: breakStart ? localDateTimeToUtc(date, breakStart.time, timeZone) : null, break_ends_at: breakEnd ? localDateTimeToUtc(date, breakEnd.time, timeZone) : null });
  } return { copied, skipped };
}
