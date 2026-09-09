import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { WorkerPresenceHistoryPage } from "../domain/worker-presence";

function formatDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}

function formatTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date(value));
}

export function WorkerPresenceHistory({
  page,
}: {
  page: WorkerPresenceHistoryPage;
}) {
  if (page.entries.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma presença registrada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {page.entries.map((entry) => (
        <article
          className="rounded-xl border bg-card p-5 shadow-sm"
          key={`${entry.scheduleEntryId}-${entry.arrivedAt}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold capitalize">
                {formatDate(entry.startsAt, entry.unitTimezone)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entry.unitName} · {entry.jobRoleName}
              </p>
            </div>
            <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
              {entry.presenceStatus === "present" ? "Em andamento" : "Concluída"}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Planejado</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {formatTime(entry.startsAt, entry.unitTimezone)} — {formatTime(entry.endsAt, entry.unitTimezone)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Realizado</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {formatTime(entry.arrivedAt, entry.unitTimezone)} — {entry.departedAt
                  ? formatTime(entry.departedAt, entry.unitTimezone)
                  : "em andamento"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            {entry.operationName} · {entry.workerRole === "replacement"
              ? "Atuação como substituto"
              : "Jornada original"}
          </p>
          {entry.arrivedAfterStart ? (
            <p className="mt-2 text-sm">Chegada após o início previsto.</p>
          ) : null}
          {entry.departedBeforeEnd ? (
            <p className="mt-1 text-sm">Saída antes do fim previsto.</p>
          ) : null}
          <Link
            className="mt-3 inline-flex min-h-10 items-center font-medium text-action-primary underline-offset-4 hover:underline"
            href={`/worker/schedule/${entry.scheduleEntryId}`}
          >
            Ver jornada
          </Link>
        </article>
      ))}
      {page.nextCursor ? (
        <Button asChild className="w-full" variant="outline">
          <Link href={`/worker/history?before=${encodeURIComponent(page.nextCursor.arrivedAt)}&entry=${page.nextCursor.scheduleEntryId}`}>
            Carregar registros anteriores
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
