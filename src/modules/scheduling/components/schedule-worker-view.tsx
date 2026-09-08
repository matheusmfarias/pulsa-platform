import { ScheduleEntryAbsenceControl } from "@/modules/absences/components/schedule-entry-absence-control";

import {
  activeAbsenceForScheduleEntry,
  activeReplacementForAbsence,
  type ScheduleEntryWithContext,
} from "../domain/scheduling";
import { zonedCivilDateTime } from "../domain/weekly-schedule";

export type WorkerScheduleGroup = {
  worker: { id: string; name: string };
  entries: ScheduleEntryWithContext[];
};

export function groupEntriesByWorker(
  entries: ScheduleEntryWithContext[],
): WorkerScheduleGroup[] {
  const groups = new Map<string, WorkerScheduleGroup>();
  for (const entry of entries) {
    const worker = entry.assignment.worker;
    if (!groups.has(worker.id)) {
      groups.set(worker.id, {
        worker: { id: worker.id, name: worker.full_name },
        entries: [],
      });
    }
    groups.get(worker.id)?.entries.push(entry);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      entries: group.entries.sort((left, right) =>
        left.starts_at.localeCompare(right.starts_at),
      ),
    }))
    .sort((left, right) => left.worker.name.localeCompare(right.worker.name));
}

export function entriesForScheduleDay(
  entries: ScheduleEntryWithContext[],
  day: string,
) {
  return entries.filter(
    (entry) =>
      zonedCivilDateTime(
        entry.starts_at,
        entry.assignment.position.unit.timezone,
      ).date === day,
  );
}

export function ScheduleWorkerView({
  scheduleId,
  entries,
  canCreateAbsence,
}: {
  scheduleId: string;
  entries: ScheduleEntryWithContext[];
  canCreateAbsence: boolean;
}) {
  const groups = groupEntriesByWorker(entries);
  return (
    <section className="py-6">
      <header>
        <h2 className="font-semibold">Programação por colaborador</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Consulta individual da revisão exibida.
        </p>
      </header>
      <div className="mt-5 space-y-5">
        {groups.length ? (
          groups.map((group) => (
            <section className="border-t border-border-default pt-4" key={group.worker.id}>
              <h3 className="font-medium">{group.worker.name}</h3>
              <div className="mt-3 space-y-2">
                {group.entries.map((entry) => {
                  const timeZone = entry.assignment.position.unit.timezone;
                  const start = zonedCivilDateTime(entry.starts_at, timeZone);
                  const end = zonedCivilDateTime(entry.ends_at, timeZone);
                  const breakStart = entry.break_starts_at
                    ? zonedCivilDateTime(entry.break_starts_at, timeZone).time
                    : null;
                  const breakEnd = entry.break_ends_at
                    ? zonedCivilDateTime(entry.break_ends_at, timeZone).time
                    : null;
                  const activeAbsence = activeAbsenceForScheduleEntry(entry);
                  const activeReplacement = activeAbsence ? activeReplacementForAbsence(activeAbsence) : null;
                  return (
                    <div
                      className={`flex flex-col gap-2 rounded-surface border px-3 py-2 text-sm sm:flex-row sm:items-start sm:justify-between ${activeAbsence ? "border-status-warning-border bg-status-warning-background/20" : "border-border-default"}`}
                      key={entry.id}
                    >
                      <div>
                        <p className="font-medium">
                          {new Intl.DateTimeFormat("pt-BR", {
                            timeZone: "UTC",
                          }).format(new Date(`${start.date}T00:00:00Z`))}{" "}
                          · {start.time}–{end.time}
                        </p>
                        {breakStart && breakEnd ? (
                          <p className="text-xs text-muted-foreground">
                            Intervalo {breakStart}–{breakEnd}
                          </p>
                        ) : null}
                        <ScheduleEntryAbsenceControl
                          activeAbsence={activeAbsence ? { ...activeAbsence, replacementWorkerName: activeReplacement?.replacement_assignment.worker.full_name } : null}
                          canCreate={canCreateAbsence}
                          scheduleEntryId={entry.id}
                          scheduleId={scheduleId}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.assignment.position.unit.name} ·{" "}
                        {entry.assignment.position.job_role.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma entrada nesta revisão.
          </p>
        )}
      </div>
    </section>
  );
}
