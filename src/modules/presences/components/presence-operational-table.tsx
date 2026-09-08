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

export function PresenceOperationalTable({
  rows,
  capabilities,
}: {
  rows: OperationalPresenceRow[];
  capabilities: PresenceCapabilities;
}) {
  return (
    <TableFrame className="mt-4">
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
  );
}
