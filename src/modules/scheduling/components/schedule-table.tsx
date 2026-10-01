import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/table";

import type { ScheduleOverview } from "../domain/scheduling";
import { ScheduleStatusBadge } from "./schedule-status-badge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function MobileScheduleCard({ schedule }: { schedule: ScheduleOverview }) {
  const href = `/app/scheduling/${schedule.id}`;

  return (
    <li>
      <article className="rounded-surface border border-border-default/80 bg-surface p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">Período da escala</p>
          {schedule.latestRevision ? (
            <ScheduleStatusBadge status={schedule.latestRevision.status} />
          ) : (
            <span className="text-xs text-muted-foreground">Sem revisão</span>
          )}
        </header>

        <Link
          className="mt-2 block break-words rounded-sm text-base font-semibold leading-6 tabular-nums text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          href={href}
        >
          {formatDate(schedule.period_start)} <span className="text-muted-foreground">a</span> {formatDate(schedule.period_end)}
        </Link>
        <p className="mt-2 break-words text-sm leading-5">{schedule.operation.name}</p>
        {schedule.latestRevision ? (
          <p className="mt-1 text-xs text-muted-foreground">Revisão {schedule.latestRevision.version}</p>
        ) : null}

        <div className="mt-3 border-t border-border-default/70 pt-3">
          <Button asChild className="h-11 w-full sm:h-9 sm:w-auto" size="sm" variant="outline">
            <Link href={href}>Ver escala <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        </div>
      </article>
    </li>
  );
}

export function ScheduleTable({ schedules }: { schedules: ScheduleOverview[] }) {
  return (
    <>
      <ul aria-label="Lista de escalas" className="mt-4 grid gap-3 xl:hidden">
        {schedules.map((schedule) => (
          <MobileScheduleCard key={schedule.id} schedule={schedule} />
        ))}
      </ul>

      <TableFrame className="mt-4 hidden xl:block">
        <TableScrollArea label="Tabela de escalas">
          <Table className="min-w-full xl:min-w-[880px]">
            <TableHeader className="lg:sticky lg:top-0 lg:z-10">
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Revisão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right"><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium tabular-nums">
                    <Link
                      className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      href={`/app/scheduling/${schedule.id}`}
                    >
                      {formatDate(schedule.period_start)} — {formatDate(schedule.period_end)}
                    </Link>
                  </TableCell>
                  <TableCell>{schedule.operation.name}</TableCell>
                  <TableCell>{schedule.latestRevision ? `v${schedule.latestRevision.version}` : "—"}</TableCell>
                  <TableCell>{schedule.latestRevision ? <ScheduleStatusBadge status={schedule.latestRevision.status} /> : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="icon" variant="ghost">
                      <Link aria-label="Ver detalhes da escala" href={`/app/scheduling/${schedule.id}`} title="Ver detalhes">
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScrollArea>
      </TableFrame>
    </>
  );
}
