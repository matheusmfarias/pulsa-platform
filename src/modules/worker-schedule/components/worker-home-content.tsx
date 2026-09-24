import Link from "next/link";
import type { ReactNode } from "react";

import type { WorkerHome } from "../domain/worker-schedule";
import { WorkerJourneyBadge } from "./worker-journey-badge";
import { WorkerScheduleCard } from "./worker-schedule-card";
import {
  formatCompactWorkerDate,
  formatWorkerTime,
} from "./worker-schedule-format";

export function WorkerHomeContent({
  home,
  presenceControl,
}: {
  home: WorkerHome;
  presenceControl?: ReactNode;
}) {
  const primary = home.current ?? home.today;
  const otherToday =
    home.current &&
    home.today &&
    home.today.scheduleEntryId !== home.current.scheduleEntryId
      ? home.today
      : null;
  const next = home.next?.scheduleEntryId === primary?.scheduleEntryId ? null : home.next;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <p className="text-sm font-medium text-action-primary">Seu dia no Pulsa</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Olá, {home.workerName}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Acompanhe suas jornadas e veja quando há uma ação disponível.
      </p>

      <section className="mt-6" aria-labelledby="worker-today">
        <h2 id="worker-today" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {home.current ? "Agora" : "Hoje"}
        </h2>
        <div className="mt-3">
          {primary ? (
            <WorkerScheduleCard
              entry={primary}
              presenceControl={presenceControl}
            />
          ) : (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <p className="font-medium">Nenhuma jornada programada para hoje.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {next
                  ? "Sua próxima jornada está logo abaixo."
                  : "Abra Escala para acompanhar as próximas jornadas."}
              </p>
            </div>
          )}
        </div>
      </section>

      {otherToday ? (
        <section className="mt-6" aria-labelledby="other-today">
          <h2 id="other-today" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Outra jornada hoje
          </h2>
          <Link
            className="group mt-3 flex min-h-24 flex-col gap-2 rounded-surface border border-border-default bg-surface p-4 transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:flex-row sm:items-center sm:justify-between"
            href={`/worker/schedule/${otherToday.scheduleEntryId}`}
          >
            <div>
              <p className="text-lg font-semibold tabular-nums">
                {formatWorkerTime(otherToday.startsAt, otherToday.unitTimezone)} — {formatWorkerTime(otherToday.endsAt, otherToday.unitTimezone)}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {otherToday.unitName} · {otherToday.jobRoleName}
              </p>
              <div className="mt-2"><WorkerJourneyBadge status={otherToday.journeyStatus} /></div>
            </div>
            <span className="text-sm font-medium text-action-primary group-hover:underline">
              Ver jornada
            </span>
          </Link>
        </section>
      ) : null}

      {next ? (
        <section className="mt-6 rounded-surface border border-border-default bg-surface p-5" aria-labelledby="next-journey">
          <h2 id="next-journey" className="text-sm font-medium text-muted-foreground">Próxima jornada</h2>
          <p className="mt-2 font-semibold capitalize">
            {formatCompactWorkerDate(next.startsAt, next.unitTimezone)} · {formatWorkerTime(next.startsAt, next.unitTimezone)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{next.unitName} · {next.jobRoleName}</p>
          <Link className="mt-3 inline-flex min-h-11 items-center rounded-sm font-medium text-action-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/worker/schedule/${next.scheduleEntryId}`}>
            Ver próxima jornada
          </Link>
        </section>
      ) : null}

    </main>
  );
}
