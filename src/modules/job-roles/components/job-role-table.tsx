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

import type { JobRole } from "../domain/job-role";
import { JobRoleStatusBadge } from "./job-role-status-badge";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

export function JobRoleTable({
  jobRoles,
}: {
  jobRoles: JobRole[];
}) {
  return (
    <TableFrame className="mt-4">
      <TableScrollArea label="Tabela de cargos">
        <Table className="min-w-full table-fixed lg:min-w-[720px] lg:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 lg:px-4">
                Cargo
              </TableHead>

              <TableHead className="hidden lg:table-cell">
                Descrição
              </TableHead>

              <TableHead className="w-28 px-2 lg:w-32 lg:px-4">
                Status
              </TableHead>

              <TableHead className="w-12 px-1 text-right lg:w-14 lg:px-4">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {jobRoles.map((jobRole) => {
              const href = `/app/job-roles/${jobRole.id}`;

              return (
                <TableRow key={jobRole.id}>
                  <TableCell className="min-w-0 px-3 font-medium lg:px-4">
                    <Link
                      className={`${relationLinkClass} block truncate`}
                      href={href}
                      title={jobRole.name}
                    >
                      {jobRole.name}
                    </Link>

                    <p
                      className="mt-2 line-clamp-2 font-normal text-xs leading-5 text-muted-foreground lg:hidden"
                      title={jobRole.description ?? undefined}
                    >
                      {jobRole.description ?? "Descrição não informada"}
                    </p>
                  </TableCell>

                  <TableCell className="hidden max-w-xl text-muted-foreground lg:table-cell">
                    <span
                      className="block truncate"
                      title={jobRole.description ?? undefined}
                    >
                      {jobRole.description ?? "Não informada"}
                    </span>
                  </TableCell>

                  <TableCell className="px-2 lg:px-4">
                    <JobRoleStatusBadge status={jobRole.status} />
                  </TableCell>

                  <TableCell className="px-1 text-right lg:px-4">
                    <Button asChild size="icon" variant="ghost">
                      <Link
                        aria-label={`Ver detalhes do cargo ${jobRole.name}`}
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