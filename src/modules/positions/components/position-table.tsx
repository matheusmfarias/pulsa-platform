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

import type { PositionGlobalListItem } from "../domain/position";
import { PositionStatusBadge } from "./position-status-badge";

const OCCUPYING_ASSIGNMENT_STATUS = "active";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function getOccupiedHeadcount(position: PositionGlobalListItem): number {
  return position.assignments.filter(
    (assignment) => assignment.status === OCCUPYING_ASSIGNMENT_STATUS,
  ).length;
}

export function PositionTable({
  positions,
}: {
  positions: PositionGlobalListItem[];
}) {
  return (
    <TableFrame className="mt-4">
      <TableScrollArea label="Tabela de postos">
        <Table className="min-w-full table-fixed xl:min-w-[980px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">
                <span className="xl:hidden">Posto</span>
                <span className="hidden xl:inline">Cargo</span>
              </TableHead>

              <TableHead className="hidden xl:table-cell">Unidade</TableHead>
              <TableHead className="hidden xl:table-cell">Operação</TableHead>
              <TableHead className="hidden xl:table-cell">Cliente</TableHead>
              <TableHead className="hidden xl:table-cell">Efetivo</TableHead>

              <TableHead className="w-28 px-2 xl:w-32 xl:px-4">
                Status
              </TableHead>

              <TableHead className="w-12 px-1 text-right xl:w-14 xl:px-4">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {positions.map((position) => {
              const occupied = getOccupiedHeadcount(position);
              const href = `/app/positions/${position.id}`;

              return (
                <TableRow key={position.id}>
                  <TableCell className="min-w-0 px-3 font-medium xl:px-4">
                    <Link
                      className={relationLinkClass + " block truncate"}
                      href={href}
                      title={position.job_role.name}
                    >
                      {position.job_role.name}
                    </Link>

                    <div className="mt-2 space-y-1 font-normal text-xs leading-5 text-muted-foreground xl:hidden">
                      <p className="truncate">
                        <Link
                          className={relationLinkClass}
                          href={`/app/units/${position.unit.id}`}
                        >
                          {position.unit.name}
                        </Link>
                      </p>

                      <p className="truncate">
                        {position.unit.operation.name}
                        <span aria-hidden="true"> · </span>
                        {position.unit.operation.contract.client.trade_name}
                      </p>

                      <p className="tabular-nums">
                        Efetivo{" "}
                        <span className="font-medium text-foreground">
                          {occupied}
                        </span>{" "}
                        de {position.base_required_headcount}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell">
                    <Link
                      className={relationLinkClass}
                      href={`/app/units/${position.unit.id}`}
                    >
                      {position.unit.name}
                    </Link>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell">
                    <Link
                      className={relationLinkClass}
                      href={`/app/operations/${position.unit.operation.id}`}
                    >
                      {position.unit.operation.name}
                    </Link>
                  </TableCell>

                  <TableCell className="hidden max-w-56 text-muted-foreground xl:table-cell">
                    <span
                      className="block truncate"
                      title={position.unit.operation.contract.client.trade_name}
                    >
                      {position.unit.operation.contract.client.trade_name}
                    </span>
                  </TableCell>

                  <TableCell className="hidden whitespace-nowrap tabular-nums xl:table-cell">
                    <span className="font-medium text-foreground">
                      {occupied}
                    </span>{" "}
                    de {position.base_required_headcount}
                  </TableCell>

                  <TableCell className="px-2 xl:px-4">
                    <PositionStatusBadge status={position.status} />
                  </TableCell>

                  <TableCell className="px-1 text-right xl:px-4">
                    <Button asChild size="icon" variant="ghost">
                      <Link
                        aria-label={`Ver detalhes do posto ${position.job_role.name}`}
                        href={href}
                        title="Ver detalhes"
                      >
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
