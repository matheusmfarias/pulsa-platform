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

function MobilePositionCard({ position }: { position: PositionGlobalListItem }) {
  const href = `/app/positions/${position.id}`;
  const occupied = getOccupiedHeadcount(position);

  return (
    <li>
      <article className="rounded-surface border border-border-default/80 bg-surface p-4">
        <header className="flex items-start justify-between gap-3">
          <Link
            className="min-w-0 break-words rounded-sm text-base font-semibold leading-6 text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            href={href}
          >
            {position.job_role.name}
          </Link>
          <PositionStatusBadge status={position.status} />
        </header>
        <p className="mt-3 break-words text-sm leading-5">
          <Link className={relationLinkClass} href={`/app/units/${position.unit.id}`}>
            {position.unit.name}
          </Link>
        </p>
        <p className="mt-0.5 break-words text-xs leading-5 text-muted-foreground">
          {position.unit.operation.name} · {position.unit.operation.contract.client.trade_name}
        </p>
        <dl className="mt-3 border-t border-border-default/70 pt-3">
          <dt className="text-xs text-muted-foreground">Efetivo alocado</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {occupied} <span className="text-sm font-normal text-muted-foreground">de {position.base_required_headcount}</span>
          </dd>
        </dl>
        <div className="mt-3 border-t border-border-default/70 pt-3">
          <Button asChild className="h-11 w-full sm:h-9 sm:w-auto" size="sm" variant="outline">
            <Link href={href}>Ver posto <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        </div>
      </article>
    </li>
  );
}

export function PositionTable({
  positions,
}: {
  positions: PositionGlobalListItem[];
}) {
  return (
    <>
      <ul aria-label="Lista de postos" className="mt-4 grid gap-3 xl:hidden">
        {positions.map((position) => (
         <MobilePositionCard key={position.id} position={position} />
        ))}
      </ul>
      <TableFrame className="mt-4 hidden xl:block">
      <TableScrollArea label="Tabela de postos" shadow>
        <Table className="min-w-full table-fixed">
          <colgroup>
            <col className="w-[19%]" />
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[14%]" />
            <col className="w-[9%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
          </colgroup>
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

              <TableHead className="px-3">
                Status
              </TableHead>

              <TableHead className="px-2 text-right">
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

                <TableCell className="px-3">
                    <PositionStatusBadge status={position.status} />
                  </TableCell>

                <TableCell className="px-2 text-right">
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
    </>
  );
}
