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
  type AbsenceWithContext,
} from "../domain/absence";
import { AbsenceStatusBadge } from "./absence-status-badge";

function formatEntryDateTime(absence: AbsenceWithContext) {
  const entry = absence.schedule_entry;
  const timeZone = entry.assignment.position.unit.timezone;
  const format = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  });
  return `${format.format(new Date(entry.starts_at))} — ${format.format(new Date(entry.ends_at))}`;
}

export function AbsenceTable({ absences }: { absences: AbsenceWithContext[] }) {
  return (
    <TableFrame className="mt-4">
      <TableScrollArea label="Tabela de ausências">
        <Table className="min-w-full table-fixed xl:min-w-[1120px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">Colaborador</TableHead>
              <TableHead className="hidden xl:table-cell">Data e horário</TableHead>
              <TableHead className="hidden xl:table-cell">Operação</TableHead>
              <TableHead className="hidden xl:table-cell">Unidade / Posto</TableHead>
              <TableHead className="w-32 px-2 xl:w-auto xl:px-4">Motivo</TableHead>
              <TableHead className="w-28 px-2 xl:w-32 xl:px-4">Status</TableHead>
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
  );
}
