import { MapPin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  WORKER_JOURNEY_LABELS,
  WORKER_JOURNEY_SHORT_LABELS,
  type WorkerScheduleEntry,
} from "../domain/worker-schedule";
import {
  formatCompactWorkerDate,
  formatScheduleUpdate,
  formatUnitLocation,
  formatWorkerTime,
} from "./worker-schedule-format";

const statusClasses = {
  original_expected: "border-border bg-card",
  replacement_expected: "border-status-info-border bg-card",
  original_absent: "border-status-neutral-border bg-card",
  original_replaced: "border-status-neutral-border bg-card",
  in_progress: "border-status-success-border bg-card",
  completed: "border-status-neutral-border bg-card",
} as const;

export function WorkerScheduleCard({
  entry,
  presenceControl,
}: {
  entry: WorkerScheduleEntry;
  presenceControl?: ReactNode;
}) {
  const location = formatUnitLocation(entry);

  return (
    <article className={`overflow-hidden rounded-xl border shadow-sm ${statusClasses[entry.journeyStatus]}`}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm font-semibold capitalize text-muted-foreground">
              {formatCompactWorkerDate(entry.startsAt, entry.unitTimezone)}
            </p>
            <p className="mt-1 whitespace-nowrap text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {formatWorkerTime(entry.startsAt, entry.unitTimezone)} — {formatWorkerTime(entry.endsAt, entry.unitTimezone)}
            </p>
          </div>
          <span className="rounded-full border bg-background/70 px-2.5 py-1 text-xs font-medium">
            {WORKER_JOURNEY_SHORT_LABELS[entry.journeyStatus]}
          </span>
        </div>
        <h3 className="mt-5 text-lg font-semibold">{entry.unitName}</h3>
        <p className="mt-1 font-medium text-muted-foreground">{entry.jobRoleName}</p>
        <p className="mt-3 text-sm text-muted-foreground">{entry.operationName}</p>
        {location ? (
          <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{location}</span>
          </p>
        ) : null}
        <p className="mt-5 border-t pt-4 text-sm font-medium leading-6">{WORKER_JOURNEY_LABELS[entry.journeyStatus]}</p>
        {entry.presenceStatus === "present" && entry.arrivedAt ? (
          <p className="mt-2 text-sm font-medium">
            Chegada registrada às {formatWorkerTime(entry.arrivedAt, entry.unitTimezone)}
          </p>
        ) : entry.presenceStatus === "completed" && entry.arrivedAt && entry.departedAt ? (
          <p className="mt-2 text-sm font-medium tabular-nums">
            {formatWorkerTime(entry.arrivedAt, entry.unitTimezone)} — {formatWorkerTime(entry.departedAt, entry.unitTimezone)}
          </p>
        ) : null}
        {entry.wasRepublished ? (
          <p className="mt-3 text-xs text-muted-foreground">{formatScheduleUpdate(entry)}</p>
        ) : null}
        {presenceControl}
        {!presenceControl ? (
          <Link
            className="mt-4 inline-flex min-h-11 items-center rounded-sm font-medium text-action-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={`/worker/schedule/${entry.scheduleEntryId}`}
          >
            Ver detalhes
          </Link>
        ) : null}
      </div>
    </article>
  );
}
