import { MapPin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  WORKER_JOURNEY_LABELS,
  type WorkerScheduleEntry,
} from "../domain/worker-schedule";
import { WorkerJourneyBadge } from "./worker-journey-badge";
import {
  formatCompactWorkerDate,
  formatScheduleUpdate,
  formatUnitLocation,
  formatWorkerTime,
} from "./worker-schedule-format";

export function WorkerScheduleCard({
  entry,
  presenceControl,
}: {
  entry: WorkerScheduleEntry;
  presenceControl?: ReactNode;
}) {
  const location = formatUnitLocation(entry);

  return (
    <article className="overflow-hidden rounded-surface border border-border-default bg-surface">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold capitalize text-muted-foreground">
              {formatCompactWorkerDate(entry.startsAt, entry.unitTimezone)}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {formatWorkerTime(entry.startsAt, entry.unitTimezone)} — {formatWorkerTime(entry.endsAt, entry.unitTimezone)}
            </p>
          </div>
          <WorkerJourneyBadge status={entry.journeyStatus} />
        </div>
        <h3 className="mt-4 text-base font-semibold sm:text-lg">{entry.unitName}</h3>
        <p className="text-sm text-muted-foreground">{entry.jobRoleName} · {entry.operationName}</p>
        {location ? (
          <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{location}</span>
          </p>
        ) : null}
        <p className="mt-4 rounded-control bg-subtle px-3 py-2 text-sm font-medium leading-6">{WORKER_JOURNEY_LABELS[entry.journeyStatus]}</p>
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
          <p className="mt-2 text-xs text-muted-foreground">{formatScheduleUpdate(entry)}</p>
        ) : null}
        {presenceControl}
        {!presenceControl ? (
          <Link
            className="mt-3 inline-flex min-h-11 items-center rounded-sm font-medium text-action-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={`/worker/schedule/${entry.scheduleEntryId}`}
          >
            Ver detalhes
          </Link>
        ) : null}
      </div>
    </article>
  );
}
