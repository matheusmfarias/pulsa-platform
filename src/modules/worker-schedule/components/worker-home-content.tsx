import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

import type { WorkerHome } from "../domain/worker-schedule";
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
  const next = home.next?.scheduleEntryId === primary?.scheduleEntryId ? null : home.next;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
      <p className="text-sm text-muted-foreground">Olá,</p>
      <h1 className="text-2xl font-semibold tracking-tight">{home.workerName}</h1>

      <section className="mt-8" aria-labelledby="worker-today">
        <p id="worker-today" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Hoje
        </p>
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
                Consulte abaixo sua próxima jornada oficial.
              </p>
            </div>
          )}
        </div>
      </section>

      {next ? (
        <section className="mt-8 rounded-xl border bg-card p-5" aria-labelledby="next-journey">
          <p id="next-journey" className="text-sm font-medium text-muted-foreground">Próxima jornada</p>
          <p className="mt-2 font-semibold capitalize">
            {formatCompactWorkerDate(next.startsAt, next.unitTimezone)} · {formatWorkerTime(next.startsAt, next.unitTimezone)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{next.unitName} · {next.jobRoleName}</p>
          <Link className="mt-3 inline-flex min-h-10 items-center font-medium text-action-primary underline-offset-4 hover:underline" href={`/worker/schedule/${next.scheduleEntryId}`}>
            Ver próxima jornada
          </Link>
        </section>
      ) : null}

      <Button asChild className="mt-8 w-full sm:w-auto">
        <Link href="/worker/schedule">Ver minha escala</Link>
      </Button>
    </main>
  );
}
