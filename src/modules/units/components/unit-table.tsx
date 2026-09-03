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

import type { UnitOperationalSummary } from "../services/list-unit-operational-summaries";
import { UnitStatusBadge } from "./unit-status-badge";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

export function UnitTable({ units }: { units: UnitOperationalSummary[] }) {
  return (
    <TableFrame className="mt-4">
      <TableScrollArea label="Tabela de unidades">
        <Table className="min-w-full table-fixed xl:min-w-[980px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">
                <span className="xl:hidden">Unidade</span>
                <span className="hidden xl:inline">Nome</span>
              </TableHead>

              <TableHead className="hidden xl:table-cell">Código</TableHead>
              <TableHead className="hidden xl:table-cell">Operação</TableHead>
              <TableHead className="hidden xl:table-cell">Cliente</TableHead>
              <TableHead className="hidden xl:table-cell">Postos</TableHead>
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
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="min-w-0 px-3 font-medium xl:px-4">
                  <Link
                    className={relationLinkClass + " block truncate"}
                    href={`/app/units/${unit.id}`}
                    title={unit.name}
                  >
                    {unit.name}
                  </Link>

                  <div className="mt-2 space-y-1 font-normal text-xs leading-5 text-muted-foreground xl:hidden">
                    {unit.code ? (
                      <p className="truncate">Código {unit.code}</p>
                    ) : null}

                    <p className="truncate">
                      <Link
                        className={relationLinkClass}
                        href={`/app/operations/${unit.operation.id}`}
                      >
                        {unit.operation.name}
                      </Link>
                    </p>

                    <p className="truncate">
                      {unit.operation.contract.client.trade_name}
                    </p>

                    <div className="space-y-1 tabular-nums">
                      <p>
                        {unit.activePositions}{" "}
                        {unit.activePositions === 1
                          ? "posto ativo"
                          : "postos ativos"}
                      </p>

                      <p>
                        Efetivo{" "}
                        <span className="font-medium text-foreground">
                          {unit.activeAssignments}
                        </span>{" "}
                        de {unit.baseRequiredHeadcount}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">
                  {unit.code ?? "—"}
                </TableCell>

                <TableCell className="hidden xl:table-cell">
                  <Link
                    className={relationLinkClass}
                    href={`/app/operations/${unit.operation.id}`}
                  >
                    {unit.operation.name}
                  </Link>
                </TableCell>

                <TableCell className="hidden max-w-56 text-muted-foreground xl:table-cell">
                  <span
                    className="block truncate"
                    title={unit.operation.contract.client.trade_name}
                  >
                    {unit.operation.contract.client.trade_name}
                  </span>
                </TableCell>

                <TableCell className="hidden whitespace-nowrap tabular-nums xl:table-cell">
                  {unit.activePositions}
                </TableCell>

                <TableCell className="hidden whitespace-nowrap tabular-nums xl:table-cell">
                  <span className="font-medium text-foreground">
                    {unit.activeAssignments}
                  </span>{" "}
                  de {unit.baseRequiredHeadcount}
                </TableCell>

                <TableCell className="px-2 xl:px-4">
                  <UnitStatusBadge status={unit.status} />
                </TableCell>

                <TableCell className="px-1 text-right xl:px-4">
                  <Button asChild size="icon" variant="ghost">
                    <Link
                      aria-label={`Ver detalhes da unidade ${unit.name}`}
                      href={`/app/units/${unit.id}`}
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
