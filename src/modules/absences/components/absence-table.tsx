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

import {
  ABSENCE_REASON_LABELS,
  isAbsenceWithoutCoverage,
  type AbsenceListItem,
} from "../domain/absence";
import { formatAbsenceJourney } from "./absence-date-format";
import { AbsenceStatusBadge } from "./absence-status-badge";

function formatEntryDateTime(absence: AbsenceListItem) {
  const entry = absence.schedule_entry;
  const timeZone = entry.assignment.position.unit.timezone;
  return formatAbsenceJourney(entry.starts_at, entry.ends_at, timeZone);
}

function MobileAbsenceCard({ absence }: { absence: AbsenceListItem }) {
  const entry = absence.schedule_entry;
  const position = entry.assignment.position;
  const operation = position.unit.operation;
  const href = `/app/absences/${absence.id}`;
  const activeReplacement = absence.replacements?.find((replacement) => replacement.status === "active");
  const withoutCoverage = isAbsenceWithoutCoverage(absence);

  return (
    <li>
      <article className="rounded-surface border border-border-default/80 bg-surface p-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              className="block break-words rounded-sm text-base font-semibold leading-6 text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              href={href}
            >
              {entry.assignment.worker.full_name}
            </Link>
            {withoutCoverage ? (
              <p className="mt-1 text-xs font-medium text-status-warning-foreground">Precisa de cobertura</p>
            ) : null}
          </div>
          <AbsenceStatusBadge status={absence.status} />
        </header>

        <p className="mt-3 font-medium tabular-nums">{formatEntryDateTime(absence)}</p>
        <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
          {position.unit.name} · {position.job_role.name}
        </p>
        <p className="break-words text-xs leading-5 text-muted-foreground">{operation.name}</p>

        <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border-default/70 pt-3 text-sm">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">Motivo</dt>
            <dd className="mt-0.5 break-words">{ABSENCE_REASON_LABELS[absence.reason]}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">Substituição</dt>
            <dd className="mt-0.5 break-words">
              {activeReplacement?.replacement_assignment
                ? activeReplacement.replacement_assignment.worker.full_name
                : withoutCoverage
                  ? "Pendente"
                  : "Sem substituto"}
            </dd>
          </div>
        </dl>

        <div className="mt-3 border-t border-border-default/70 pt-3">
          <Button asChild className="h-11 w-full sm:h-9 sm:w-auto" size="sm" variant="outline">
            <Link href={href}>
              Ver detalhes <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </article>
    </li>
  );
}

export function AbsenceTable({ absences }: { absences: AbsenceListItem[] }) {
  return (
    <>
      <ul aria-label="Lista de ausências" className="mt-4 grid gap-3 xl:hidden">
        {absences.map((absence) => (
          <MobileAbsenceCard absence={absence} key={absence.id} />
        ))}
      </ul>
      <TableFrame className="mt-4 hidden xl:block">
      <TableScrollArea label="Tabela de ausências">
        <Table className="min-w-full table-fixed xl:min-w-[1120px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">Colaborador</TableHead>
              <TableHead className="hidden xl:table-cell">Data e horário</TableHead>
              <TableHead className="hidden xl:table-cell">Operação</TableHead>
              <TableHead className="hidden xl:table-cell">Unidade / Posto</TableHead>
              <TableHead className="w-32 px-2 xl:w-auto xl:px-4">Motivo</TableHead>
              <TableHead className="w-44 px-2 xl:w-32 xl:px-4">Situação</TableHead>
              <TableHead className="hidden xl:table-cell">Substituição</TableHead>
              <TableHead className="w-12 px-1 text-right xl:px-4">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {absences.map((absence) => {
              const entry = absence.schedule_entry;
              const position = entry.assignment.position;
              const operation = position.unit.operation;
              const href = `/app/absences/${absence.id}`;
              const activeReplacement = absence.replacements?.find((replacement) => replacement.status === "active");
              const withoutCoverage = isAbsenceWithoutCoverage(absence);
              return (
                <TableRow className={withoutCoverage ? "bg-status-warning-background/20" : undefined} key={absence.id}>
                  <TableCell className="min-w-0 px-3 font-medium xl:px-4">
                    <Link
                      className="block truncate rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      href={href}
                    >
                      {entry.assignment.worker.full_name}
                    </Link>
                    <div className="mt-1 space-y-0.5 text-xs font-normal leading-5 text-muted-foreground xl:hidden">
                      <p className="tabular-nums">{formatEntryDateTime(absence)}</p>
                      <p className="truncate">{operation.name} · {position.unit.name}</p>
                      <p className="truncate">{position.job_role.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground xl:table-cell">
                    {formatEntryDateTime(absence)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{operation.name}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <p>{position.unit.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{position.job_role.name}</p>
                  </TableCell>
                  <TableCell className="px-2 xl:px-4">
                    {ABSENCE_REASON_LABELS[absence.reason]}
                  </TableCell>
                  <TableCell className="px-2 xl:px-4">
                    <AbsenceStatusBadge status={absence.status} />
                    {withoutCoverage ? <p className="mt-1 text-xs font-medium text-status-warning-foreground">Sem cobertura</p> : null}
                    {activeReplacement?.replacement_assignment ? (
                      <p className="mt-1 text-xs leading-5 text-muted-foreground xl:hidden">
                        Coberta por {activeReplacement.replacement_assignment.worker.full_name}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                    {activeReplacement?.replacement_assignment
                      ? `Substituída por ${activeReplacement.replacement_assignment.worker.full_name}`
                      : "Sem substituto"}
                  </TableCell>
                  <TableCell className="px-1 text-right xl:px-4">
                    <Button asChild size="icon" variant="ghost">
                      <Link aria-label="Ver detalhes da ausência" href={href}>
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableScrollArea>
      </TableFrame>
    </>
  );
}
