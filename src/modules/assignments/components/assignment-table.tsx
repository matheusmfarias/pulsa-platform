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

import type { AssignmentWithContext } from "../domain/assignment";
import { AssignmentStatusBadge } from "./assignment-status-badge";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function formatDate(value: string | null): string {
  if (!value) return "Em aberto";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}

export function AssignmentTable({
  assignments,
}: {
  assignments: AssignmentWithContext[];
}) {
  return (
    <TableFrame className="mt-4">
      <TableScrollArea label="Tabela de alocações">
        <Table className="min-w-full table-fixed xl:min-w-[920px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">
                <span className="xl:hidden">Alocação</span>
                <span className="hidden xl:inline">Colaborador</span>
              </TableHead>

              <TableHead className="hidden xl:table-cell">
                Posto
              </TableHead>

              <TableHead className="hidden xl:table-cell">
                Unidade
              </TableHead>

              <TableHead className="hidden xl:table-cell">
                Período
              </TableHead>

              <TableHead className="w-28 px-2 xl:w-32 xl:px-4">
                Status
              </TableHead>

              <TableHead className="w-12 px-1 text-right xl:w-14 xl:px-4">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {assignments.map((assignment) => {
              const href = `/app/assignments/${assignment.id}`;

              return (
                <TableRow key={assignment.id}>
                  <TableCell className="min-w-0 px-3 font-medium xl:px-4">
                    <Link
                      className={relationLinkClass + " block truncate"}
                      href={href}
                      title={assignment.worker.full_name}
                    >
                      {assignment.worker.full_name}
                    </Link>

                    <div className="mt-2 space-y-1 font-normal text-xs leading-5 text-muted-foreground xl:hidden">
                      <p className="truncate">
                        <Link
                          className={relationLinkClass}
                          href={`/app/units/${assignment.position.unit.id}/positions/${assignment.position.id}`}
                        >
                          {assignment.position.job_role.name}
                        </Link>
                      </p>

                      <p className="truncate">
                        <Link
                          className={relationLinkClass}
                          href={`/app/units/${assignment.position.unit.id}`}
                        >
                          {assignment.position.unit.name}
                        </Link>
                      </p>

                      <p className="tabular-nums">
                        {formatDate(assignment.start_date)} —{" "}
                        {formatDate(assignment.end_date)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell">
                    <Link
                      className={relationLinkClass}
                      href={`/app/units/${assignment.position.unit.id}/positions/${assignment.position.id}`}
                    >
                      {assignment.position.job_role.name}
                    </Link>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell">
                    <Link
                      className={relationLinkClass}
                      href={`/app/units/${assignment.position.unit.id}`}
                    >
                      {assignment.position.unit.name}
                    </Link>
                  </TableCell>

                  <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground xl:table-cell">
                    {formatDate(assignment.start_date)} —{" "}
                    {formatDate(assignment.end_date)}
                  </TableCell>

                  <TableCell className="px-2 xl:px-4">
                    <AssignmentStatusBadge status={assignment.status} />
                  </TableCell>

                  <TableCell className="px-1 text-right xl:px-4">
                    <Button asChild size="icon" variant="ghost">
                      <Link
                        aria-label={`Ver alocação de ${assignment.worker.full_name}`}
                        href={href}
                        title="Ver detalhes"
                      >
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4"
                        />
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