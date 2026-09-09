import type { WorkerScheduleEntry } from "../domain/worker-schedule";
import { WorkerScheduleCard } from "./worker-schedule-card";

export function WorkerScheduleList({ entries }: { entries: WorkerScheduleEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma jornada nesta semana.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <WorkerScheduleCard entry={entry} key={entry.scheduleEntryId} />
      ))}
    </div>
  );
}
