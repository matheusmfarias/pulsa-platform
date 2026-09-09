import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  addCivilDays,
  currentUtcDate,
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
  const fromDate = validDate(requestedStart) ? requestedStart : currentUtcDate();
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
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Escala oficial</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Minha escala</h1>
        </div>
        <p className="text-sm font-medium capitalize">{startLabel} — {endLabel}</p>
      </div>

      <nav aria-label="Navegar entre semanas" className="mt-6 grid grid-cols-2 gap-3">
        <Button asChild variant="outline">
          <Link href={`/worker/schedule?start=${addCivilDays(fromDate, -7)}`}>
            <ChevronLeft aria-hidden="true" className="size-4" />
            Semana anterior
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/worker/schedule?start=${addCivilDays(fromDate, 7)}`}>
            Próxima semana
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </nav>

      <section aria-label="Jornadas da semana" className="mt-6">
        <WorkerScheduleList entries={entries} />
      </section>
    </main>
  );
}
