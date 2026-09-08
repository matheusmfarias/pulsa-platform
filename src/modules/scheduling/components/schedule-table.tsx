import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow, TableScrollArea } from "@/components/ui/table";

import type { ScheduleOverview } from "../domain/scheduling";
import { ScheduleStatusBadge } from "./schedule-status-badge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function ScheduleTable({ schedules }: { schedules: ScheduleOverview[] }) {
  return <TableFrame className="mt-4"><TableScrollArea label="Tabela de escalas"><Table className="min-w-full table-fixed xl:min-w-[880px] xl:table-auto"><TableHeader><TableRow>
    <TableHead className="px-3 xl:px-4">Período</TableHead><TableHead className="hidden xl:table-cell">Operação</TableHead><TableHead className="hidden xl:table-cell">Revisão</TableHead><TableHead className="w-40 px-2 xl:px-4">Status</TableHead><TableHead className="w-12 px-1 text-right xl:px-4"><span className="sr-only">Ações</span></TableHead>
  </TableRow></TableHeader><TableBody>{schedules.map((schedule) => <TableRow key={schedule.id}>
    <TableCell className="px-3 font-medium tabular-nums xl:px-4"><Link className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" href={`/app/scheduling/${schedule.id}`}>{formatDate(schedule.period_start)} — {formatDate(schedule.period_end)}</Link><p className="mt-1 text-xs font-normal text-muted-foreground xl:hidden">{schedule.operation.name} · {schedule.latestRevision ? `v${schedule.latestRevision.version}` : "Sem revisão"}</p></TableCell>
    <TableCell className="hidden xl:table-cell">{schedule.operation.name}</TableCell><TableCell className="hidden xl:table-cell">{schedule.latestRevision ? `v${schedule.latestRevision.version}` : "—"}</TableCell><TableCell className="px-2 xl:px-4">{schedule.latestRevision ? <ScheduleStatusBadge status={schedule.latestRevision.status} /> : "—"}</TableCell><TableCell className="px-1 text-right xl:px-4"><Button asChild size="icon" variant="ghost"><Link aria-label="Ver detalhes da escala" href={`/app/scheduling/${schedule.id}`} title="Ver detalhes"><ArrowRight aria-hidden="true" className="size-4" /></Link></Button></TableCell>
  </TableRow>)}</TableBody></Table></TableScrollArea></TableFrame>;
}
