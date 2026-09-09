import Link from "next/link";

import {
  WORKER_JOURNEY_LABELS,
  WORKER_JOURNEY_SHORT_LABELS,
  type WorkerScheduleEntry,
} from "../domain/worker-schedule";
import {
  formatCompactWorkerDate,
  formatScheduleUpdate,
  formatWorkerTime,
} from "./worker-schedule-format";

const statusClasses = {
  original_expected: "border-border bg-card",
  replacement_expected: "border-sky-300 bg-sky-50/70",
  original_absent: "border-amber-300 bg-amber-50/70",
  original_replaced: "border-amber-300 bg-amber-50/70",
  in_progress: "border-emerald-300 bg-emerald-50/70",
  completed: "border-slate-300 bg-slate-50/70",
} as const;

export function WorkerScheduleCard({ entry }: { entry: WorkerScheduleEntry }) {
  return (
    <article className={`rounded-xl border p-5 shadow-sm ${statusClasses[entry.journeyStatus]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium capitalize text-muted-foreground">
            {formatCompactWorkerDate(entry.startsAt, entry.unitTimezone)}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatWorkerTime(entry.startsAt, entry.unitTimezone)} — {formatWorkerTime(entry.endsAt, entry.unitTimezone)}
          </p>
        </div>
        <span className="rounded-full border bg-background/70 px-2.5 py-1 text-xs font-medium">
          {WORKER_JOURNEY_SHORT_LABELS[entry.journeyStatus]}
        </span>
      </div>
      <h2 className="mt-4 font-semibold">{entry.unitName}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{entry.jobRoleName}</p>
      <p className="mt-3 text-sm leading-6">{WORKER_JOURNEY_LABELS[entry.journeyStatus]}</p>
      {entry.wasRepublished ? (
        <p className="mt-3 text-xs text-muted-foreground">{formatScheduleUpdate(entry)}</p>
      ) : null}
      <Link
        className="mt-4 inline-flex min-h-10 items-center font-medium text-action-primary underline-offset-4 hover:underline"
        href={`/worker/schedule/${entry.scheduleEntryId}`}
      >
        Ver detalhes
      </Link>
    </article>
  );
}
