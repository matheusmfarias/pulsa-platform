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

import type { OperationalPresenceRow } from "../domain/operational-presence";
import { PresenceControls } from "./presence-controls";
import { PresenceStatusBadge } from "./presence-status-badge";

function formatTime(value: string | null, timeZone: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

export type PresenceCapabilities = {
  create: boolean;
  update: boolean;
  cancel: boolean;
};

function MobilePresenceCard({
  row,
  capabilities,
}: {
  row: OperationalPresenceRow;
  capabilities: PresenceCapabilities;
}) {
  const replacementExpected = row.replacement_worker_name !== null;
  const uncovered = row.operational_status === "uncovered_absence";
  const expectedWorker = uncovered
    ? row.original_worker_name
    : row.replacement_worker_name ?? row.original_worker_name;

  return (
    <li>
      <article className="rounded-surface border border-border-default/80 bg-surface p-4">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              {uncovered ? "Jornada sem cobertura" : "Horário previsto"}
            </p>
            <p className="mt-1 whitespace-nowrap text-base font-semibold leading-6 tabular-nums sm:text-lg">
              {formatTime(row.starts_at, row.unit_timezone)}
              <span className="px-1 text-muted-foreground">–</span>
              {formatTime(row.ends_at, row.unit_timezone)}
            </p>
          </div>
          <PresenceStatusBadge status={row.operational_status} />
        </header>

        <div className="mt-3 min-w-0">
          <p className="break-words font-semibold leading-5">
            {uncovered ? "Cobertura pendente" : expectedWorker}
          </p>
          {uncovered ? (
            <p className="mt-0.5 text-sm text-muted-foreground">Jornada de {expectedWorker}</p>
          ) : replacementExpected ? (
            <p className="mt-0.5 text-sm text-muted-foreground">Substitui {row.original_worker_name}</p>
          ) : null}
          <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
            {row.unit_name} · {row.job_role_name}
          </p>
          <p className="break-words text-xs leading-5 text-muted-foreground">
            {row.operation_name}
          </p>
        </div>

        {(row.arrived_at || row.departed_at || row.arrived_after_start || row.departed_before_end) ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border-default/70 pt-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Chegada</dt>
              <dd className="mt-0.5 tabular-nums">{formatTime(row.arrived_at, row.unit_timezone)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Saída</dt>
              <dd className="mt-0.5 tabular-nums">{formatTime(row.departed_at, row.unit_timezone)}</dd>
            </div>
          </dl>
        ) : null}
        {row.arrived_after_start ? (
          <p className="mt-2 text-xs font-medium text-status-warning-foreground">Chegada após início</p>
        ) : null}
        {row.departed_before_end ? (
          <p className="mt-1 text-xs font-medium text-status-warning-foreground">Saída antes do fim</p>
        ) : null}

        <div className="mt-3 border-t border-border-default/70 pt-3">
          {uncovered && row.absence_id ? (
            <Button asChild className="h-11 w-full sm:h-9 sm:w-auto" size="sm" variant="outline">
              <Link href={`/app/absences/${row.absence_id}`}>Definir cobertura</Link>
            </Button>
          ) : (
            <PresenceControls
              canCancel={capabilities.cancel}
              canComplete={capabilities.update}
              canCorrect={capabilities.update}
              canStart={capabilities.create}
              row={row}
            />
          )}
        </div>
      </article>
    </li>
  );
}

export function PresenceOperationalTable({
  rows,
  capabilities,
}: {
  rows: OperationalPresenceRow[];
  capabilities: PresenceCapabilities;
}) {
  return (
    <>
      <ul aria-label="Acompanhamento operacional de presença" className="mt-4 grid gap-3 xl:hidden">
        {rows.map((row) => (
          <MobilePresenceCard capabilities={capabilities} key={row.schedule_entry_id} row={row} />
        ))}
      </ul>
      <TableFrame className="mt-4 hidden xl:block">
      <TableScrollArea label="Acompanhamento operacional de presença">
        <Table className="min-w-full table-fixed xl:min-w-[1180px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 px-3 xl:px-4">Horário</TableHead>
              <TableHead className="px-3 xl:px-4">Colaborador esperado</TableHead>
              <TableHead className="hidden xl:table-cell">Operação</TableHead>
              <TableHead className="hidden xl:table-cell">Unidade / Posto</TableHead>
              <TableHead className="w-40 px-2 xl:w-auto xl:px-4">Estado</TableHead>
              <TableHead className="hidden xl:table-cell">Realizado</TableHead>
              <TableHead className="w-44 px-2 text-right xl:w-auto xl:px-4">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const replacementExpected = row.replacement_worker_name !== null;
              const expectedWorker = row.operational_status === "uncovered_absence"
                ? "Sem cobertura"
                : row.replacement_worker_name ?? row.original_worker_name;
              return (
                <TableRow key={row.schedule_entry_id}>
                  <TableCell className="px-3 font-medium tabular-nums xl:px-4">
                    {formatTime(row.starts_at, row.unit_timezone)}
                    <span className="text-muted-foreground">–{formatTime(row.ends_at, row.unit_timezone)}</span>
                  </TableCell>
                  <TableCell className="min-w-0 px-3 xl:px-4">
                    <p className="truncate font-medium">{expectedWorker}</p>
                    {replacementExpected ? <p className="mt-0.5 text-xs text-muted-foreground">Substitui {row.original_worker_name}</p> : null}
                    <p className="mt-1 truncate text-xs text-muted-foreground xl:hidden">{row.operation_name} · {row.unit_name} · {row.job_role_name}</p>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{row.operation_name}</TableCell>
                  <TableCell className="hidden xl:table-cell"><p>{row.unit_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.job_role_name}</p></TableCell>
                  <TableCell className="px-2 xl:px-4">
                    <PresenceStatusBadge status={row.operational_status} />
                    {row.arrived_at ? (
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground xl:hidden">
                        Chegada {formatTime(row.arrived_at, row.unit_timezone)}
                        {row.departed_at ? ` · Saída ${formatTime(row.departed_at, row.unit_timezone)}` : ""}
                      </p>
                    ) : null}
                    {row.arrived_after_start ? <p className="mt-1 text-xs font-medium text-status-warning-foreground">Chegada após início</p> : null}
                    {row.departed_before_end ? <p className="mt-1 text-xs font-medium text-status-warning-foreground">Saída antes do fim</p> : null}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap tabular-nums xl:table-cell">
                    {formatTime(row.arrived_at, row.unit_timezone)} — {formatTime(row.departed_at, row.unit_timezone)}
                    {row.actual_worker_name ? <p className="mt-0.5 text-xs text-muted-foreground">{row.actual_worker_name}</p> : null}
                  </TableCell>
                  <TableCell className="px-2 text-right xl:px-4">
                    {row.operational_status === "uncovered_absence" && row.absence_id ? (
                      <Button asChild size="sm" variant="outline"><Link href={`/app/absences/${row.absence_id}`}>Definir cobertura</Link></Button>
                    ) : (
                      <PresenceControls
                        canCancel={capabilities.cancel}
                        canComplete={capabilities.update}
                        canCorrect={capabilities.update}
                        canStart={capabilities.create}
                        row={row}
                      />
                    )}
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
