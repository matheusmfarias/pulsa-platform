import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  addCivilDays,
  getWorkerScheduleAnchorDate,
  listWorkerSchedule,
  WorkerScheduleList,
} from "@/modules/worker-schedule";

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function WorkerSchedulePage({
  searchParams,
}: PageProps<"/worker/schedule">) {
  const requestedStart = (await searchParams).start;
  const anchorDate = await getWorkerScheduleAnchorDate();
  const fromDate = validDate(requestedStart)
    ? requestedStart
    : anchorDate;
  const toDate = addCivilDays(fromDate, 6);
  const entries = await listWorkerSchedule({ fromDate, toDate });

  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
  const startLabel = formatter.format(new Date(`${fromDate}T12:00:00Z`));
  const endLabel = formatter.format(new Date(`${toDate}T12:00:00Z`));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Escala oficial</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Minha escala</h1>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Semana exibida</p>
          <p className="mt-1 text-sm font-semibold capitalize">{startLabel} — {endLabel}</p>
        </div>
      </div>

      <nav aria-label="Navegar entre semanas" className="mt-6 grid grid-cols-2 gap-3">
        <Button asChild className="min-h-11" variant="outline">
          <Link href={`/worker/schedule?start=${addCivilDays(fromDate, -7)}`}>
            <ChevronLeft aria-hidden="true" className="size-4" />
            Semana anterior
          </Link>
        </Button>
        <Button asChild className="min-h-11" variant="outline">
          <Link href={`/worker/schedule?start=${addCivilDays(fromDate, 7)}`}>
            Próxima semana
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </nav>

      {fromDate !== anchorDate ? (
        <div className="mt-3 text-center">
          <Button asChild className="min-h-11" variant="ghost">
            <Link href={`/worker/schedule?start=${anchorDate}`}>Hoje</Link>
          </Button>
        </div>
      ) : null}

      <section aria-labelledby="worker-week-schedule" className="mt-6">
        <h2 className="sr-only" id="worker-week-schedule">Jornadas da semana</h2>
        <WorkerScheduleList entries={entries} />
      </section>
    </main>
  );
}
