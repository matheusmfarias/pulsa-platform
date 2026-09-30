import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/table";

import { formatCpf } from "../domain/document-number";
import type { WorkerWithCurrentAssignment } from "../services/list-workers-with-current-assignment";
import { WorkerStatusBadge } from "./worker-status-badge";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";
const identityLinkClass =
  "block truncate rounded-sm font-semibold text-foreground underline-offset-4 decoration-border-strong transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function contactLabel(worker: WorkerWithCurrentAssignment): string {
  return worker.email ?? worker.phone ?? "Contato não informado";
}

function AssignmentSummary({
  worker,
  compact = false,
}: {
  worker: WorkerWithCurrentAssignment;
  compact?: boolean;
}) {
  if (!worker.currentAssignment) {
    return compact ? "Sem alocação" : <span className="text-muted-foreground">Sem alocação</span>;
  }

  if (compact) {
    return (
      <>
        <span>{worker.currentAssignment.position.job_role.name}</span>
        <span aria-hidden="true"> · </span>
        <Link
          className={relationLinkClass}
          href={"/app/units/" + worker.currentAssignment.position.unit.id}
        >
          {worker.currentAssignment.position.unit.name}
        </Link>
      </>
    );
  }

  return (
    <div className="min-w-0 leading-5">
      <span className="block truncate font-medium text-foreground">
        {worker.currentAssignment.position.job_role.name}
      </span>
      <Link
        className={relationLinkClass + " block truncate text-xs text-muted-foreground hover:text-foreground"}
        href={"/app/units/" + worker.currentAssignment.position.unit.id}
        title={worker.currentAssignment.position.unit.name}
      >
        {worker.currentAssignment.position.unit.name}
      </Link>
    </div>
  );
}

export function WorkerTable({
  workers,
}: {
  workers: WorkerWithCurrentAssignment[];
}) {
  return (
    <>
      <ul aria-label="Lista de colaboradores" className="grid gap-2 border-t border-border-default/80 bg-subtle/35 p-3 xl:hidden">
        {workers.map((worker) => (
          <li key={worker.id}>
            <article className="rounded-surface border border-border-default/80 bg-surface p-4">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    className="block break-words rounded-sm text-base font-semibold leading-6 text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    href={`/app/workers/${worker.id}`}
                  >
                    {worker.full_name}
                  </Link>
                  <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                    <AssignmentSummary compact worker={worker} />
                  </p>
                </div>
                <WorkerStatusBadge status={worker.status} />
              </header>
              <dl className="mt-3 grid gap-2 border-t border-border-default/70 pt-3 text-sm sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">CPF</dt>
                  <dd className="mt-0.5 break-words tabular-nums">{formatCpf(worker.document_number)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">Contato</dt>
                  <dd className="mt-0.5 break-words">{contactLabel(worker)}</dd>
                </div>
              </dl>
            </article>
          </li>
        ))}
      </ul>
      <div className="hidden border-t border-border-default/80 xl:block">
      <TableScrollArea label="Tabela de colaboradores" shadow>
        <Table className="min-w-full table-fixed">
          <TableHeader className="bg-subtle/45 text-xs normal-case tracking-normal text-muted-foreground">
            <TableRow>
              <TableHead className="w-[24%] px-4">Nome</TableHead>
              <TableHead className="w-[16%] px-3">CPF</TableHead>
              <TableHead className="w-[21%] px-3">Contato</TableHead>
              <TableHead className="w-[23%] px-3">Alocação atual</TableHead>
              <TableHead className="w-[11%] px-3">Status</TableHead>
              <TableHead className="w-[5%] px-2 text-right">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-border-default/65">
            {workers.map((worker) => (
              <TableRow className="h-14 hover:bg-hover/40 focus-within:bg-hover/50" key={worker.id}>
                <TableCell className="min-w-0 px-4 py-2.5">
                  <Link
                    className={identityLinkClass}
                    href={"/app/workers/" + worker.id}
                    title={worker.full_name}
                  >
                    {worker.full_name}
                  </Link>
                </TableCell>
                <TableCell className="truncate whitespace-nowrap px-3 tabular-nums text-foreground/75">
                  {formatCpf(worker.document_number)}
                </TableCell>
                <TableCell className="max-w-56 px-3 text-foreground/75">
                  <span className="block truncate">{contactLabel(worker)}</span>
                </TableCell>
                <TableCell className="max-w-64 px-3">
                  <span className="block truncate">
                    <AssignmentSummary worker={worker} />
                  </span>
                </TableCell>
                <TableCell className="px-3">
                  <WorkerStatusBadge status={worker.status} />
                </TableCell>
                <TableCell className="px-2 text-right">
                  <Button asChild className="text-muted-foreground/80 hover:bg-hover/70 hover:text-foreground" size="icon" variant="ghost">
                    <Link
                      aria-label={"Ver detalhes de " + worker.full_name}
                      href={"/app/workers/" + worker.id}
                      title="Ver colaborador"
                    >
                      <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
      </div>
    </>
  );
}
