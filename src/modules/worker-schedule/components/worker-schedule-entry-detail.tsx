import { MapPin } from "lucide-react";
import type { ReactNode } from "react";

import {
  WORKER_JOURNEY_LABELS,
  WORKER_JOURNEY_SHORT_LABELS,
  type WorkerScheduleEntry,
} from "../domain/worker-schedule";
import {
  formatScheduleUpdate,
  formatUnitLocation,
  formatWorkerDate,
  formatWorkerTime,
} from "./worker-schedule-format";

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm leading-6">{value}</dd>
    </div>
  );
}

export function WorkerScheduleEntryDetail({
  entry,
  presenceControl,
}: {
  entry: WorkerScheduleEntry;
  presenceControl?: ReactNode;
}) {
  const location = formatUnitLocation(entry);
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm sm:p-8">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div>
          <p className="capitalize text-muted-foreground">{formatWorkerDate(entry.startsAt, entry.unitTimezone)}</p>
          <h1 className="mt-2 whitespace-nowrap text-3xl font-semibold tracking-tight tabular-nums">{formatWorkerTime(entry.startsAt, entry.unitTimezone)} — {formatWorkerTime(entry.endsAt, entry.unitTimezone)}</h1>
        </div>
        <span className="rounded-full border px-3 py-1 text-sm font-medium">{WORKER_JOURNEY_SHORT_LABELS[entry.journeyStatus]}</span>
      </div>
      <p className="mt-6 rounded-lg bg-muted/60 p-4 text-sm leading-6">{WORKER_JOURNEY_LABELS[entry.journeyStatus]}</p>
      <dl className="mt-8 grid gap-6 sm:grid-cols-2">
        <Item label="Unidade" value={entry.unitName} />
        <Item label="Cargo / posto" value={entry.jobRoleName} />
        <Item label="Operação" value={entry.operationName} />
        {location ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Endereço</dt>
            <dd className="mt-1 flex items-start gap-2 text-sm leading-6">
              <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <span>{location}</span>
            </dd>
          </div>
        ) : null}
        {entry.breakStartsAt && entry.breakEndsAt ? <Item label="Intervalo planejado" value={`${formatWorkerTime(entry.breakStartsAt, entry.unitTimezone)} — ${formatWorkerTime(entry.breakEndsAt, entry.unitTimezone)}`} /> : null}
        {entry.presenceStatus ? <Item label="Presença" value={entry.presenceStatus === "present" ? `Chegada registrada às ${formatWorkerTime(entry.arrivedAt!, entry.unitTimezone)}` : `Jornada concluída · ${formatWorkerTime(entry.arrivedAt!, entry.unitTimezone)} — ${formatWorkerTime(entry.departedAt!, entry.unitTimezone)}`} /> : null}
      </dl>
      {entry.wasRepublished ? <p className="mt-8 border-t pt-5 text-sm text-muted-foreground">{formatScheduleUpdate(entry)}</p> : null}
      {presenceControl}
    </article>
  );
}
