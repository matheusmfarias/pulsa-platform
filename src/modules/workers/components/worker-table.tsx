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

import { formatCpf } from "../domain/document-number";
import type { WorkerWithCurrentAssignment } from "../services/list-workers-with-current-assignment";
import { WorkerStatusBadge } from "./worker-status-badge";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

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

export function WorkerTable({
  workers,
}: {
  workers: WorkerWithCurrentAssignment[];
}) {
  return (
    <TableFrame className="mt-4">
      <TableScrollArea label="Tabela de colaboradores">
        <Table className="min-w-full table-fixed xl:min-w-[900px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">
                <span className="xl:hidden">Colaborador</span>
                <span className="hidden xl:inline">Nome</span>
              </TableHead>
              <TableHead className="hidden xl:table-cell">CPF</TableHead>
              <TableHead className="hidden xl:table-cell">Contato</TableHead>
              <TableHead className="hidden xl:table-cell">Alocação atual</TableHead>
              <TableHead className="w-28 px-2 xl:w-36 xl:px-4">Status</TableHead>
              <TableHead className="w-12 px-1 text-right xl:w-14 xl:px-4">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="min-w-0 px-3 font-medium xl:px-4">
                  <Link
                    className={relationLinkClass + " block truncate"}
                    href={"/app/workers/" + worker.id}
                    title={worker.full_name}
                  >
                    {worker.full_name}
                  </Link>
                  <div className="mt-2 space-y-1 font-normal text-xs text-muted-foreground xl:hidden">
                    <p className="tabular-nums">CPF {formatCpf(worker.document_number)}</p>
                    <p className="max-w-52 truncate">{contactLabel(worker)}</p>
                    <p className="max-w-52 truncate">
                      <AssignmentSummary compact worker={worker} />
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground xl:table-cell">
                  {formatCpf(worker.document_number)}
                </TableCell>
                <TableCell className="hidden max-w-56 text-muted-foreground xl:table-cell">
                  <span className="block truncate">{contactLabel(worker)}</span>
                </TableCell>
                <TableCell className="hidden max-w-64 xl:table-cell">
                  <span className="block truncate">
                    <AssignmentSummary worker={worker} />
                  </span>
                </TableCell>
                <TableCell className="px-2 xl:px-4">
                  <WorkerStatusBadge status={worker.status} />
                </TableCell>
                <TableCell className="px-1 text-right xl:px-4">
                  <Button asChild size="icon" variant="ghost">
                    <Link
                      aria-label={"Ver detalhes de " + worker.full_name}
                      href={"/app/workers/" + worker.id}
                      title="Ver detalhes"
                    >
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
  );
}
