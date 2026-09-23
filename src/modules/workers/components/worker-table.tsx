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
    <div className="border-t border-border-default/80">
      <TableScrollArea label="Tabela de colaboradores" shadow>
        <Table className="min-w-full table-fixed sm:min-w-[960px] sm:table-auto">
          <TableHeader className="bg-subtle/45 text-xs normal-case tracking-normal text-muted-foreground">
            <TableRow>
              <TableHead className="w-auto px-3 sm:w-[24%] sm:px-5">
                <span className="sm:hidden">Colaborador</span>
                <span className="hidden sm:inline">Nome</span>
              </TableHead>
              <TableHead className="hidden w-[16%] sm:table-cell sm:px-5">CPF</TableHead>
              <TableHead className="hidden w-[23%] sm:table-cell sm:px-5">Contato</TableHead>
              <TableHead className="hidden w-[25%] sm:table-cell sm:px-5">Alocação atual</TableHead>
              <TableHead className="w-28 px-2 sm:w-[12%] sm:px-5">Status</TableHead>
              <TableHead className="w-12 px-1 text-right sm:w-14 sm:px-4">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-border-default/65">
            {workers.map((worker) => (
              <TableRow className="h-14 hover:bg-hover/40 focus-within:bg-hover/50" key={worker.id}>
                <TableCell className="min-w-0 px-3 py-2.5 sm:px-5">
                  <Link
                    className={identityLinkClass}
                    href={"/app/workers/" + worker.id}
                    title={worker.full_name}
                  >
                    {worker.full_name}
                  </Link>
                  <div className="mt-1.5 space-y-0.5 font-normal text-xs leading-5 text-muted-foreground sm:hidden">
                    <p className="tabular-nums">CPF {formatCpf(worker.document_number)}</p>
                    <p className="max-w-52 truncate">{contactLabel(worker)}</p>
                    <p className="break-words">
                      <AssignmentSummary compact worker={worker} />
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap tabular-nums text-foreground/75 sm:table-cell sm:px-5">
                  {formatCpf(worker.document_number)}
                </TableCell>
                <TableCell className="hidden max-w-56 text-foreground/75 sm:table-cell sm:px-5">
                  <span className="block truncate">{contactLabel(worker)}</span>
                </TableCell>
                <TableCell className="hidden max-w-64 sm:table-cell sm:px-5">
                  <span className="block truncate">
                    <AssignmentSummary worker={worker} />
                  </span>
                </TableCell>
                <TableCell className="px-2 sm:px-5">
                  <WorkerStatusBadge status={worker.status} />
                </TableCell>
                <TableCell className="px-1 text-right sm:px-4">
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
  );
}
