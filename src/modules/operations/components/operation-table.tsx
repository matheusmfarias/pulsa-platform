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

import type { OperationWithContext } from "../domain/operation";
import { OperationStatusBadge } from "./operation-status-badge";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function formatDate(value: string | null): string {
  if (!value) return "Em aberto";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}

function OperationPeriod({
  operation,
  compact = false,
}: {
  operation: OperationWithContext;
  compact?: boolean;
}) {
  const value =
    formatDate(operation.start_date) +
    " — " +
    formatDate(operation.end_date);

  return compact ? (
    <span>{value}</span>
  ) : (
    <span className="whitespace-nowrap tabular-nums">{value}</span>
  );
}

export function OperationTable({
  operations,
}: {
  operations: OperationWithContext[];
}) {
  return (
    <TableFrame className="mt-4">
      <TableScrollArea label="Tabela de operações">
        <Table className="min-w-full table-fixed xl:min-w-[900px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">
                <span className="xl:hidden">Operação</span>
                <span className="hidden xl:inline">Nome</span>
              </TableHead>

              <TableHead className="hidden xl:table-cell">
                Cliente
              </TableHead>

              <TableHead className="hidden xl:table-cell">
                Contrato
              </TableHead>

              <TableHead className="hidden xl:table-cell">
                Período
              </TableHead>

              <TableHead className="w-28 px-2 xl:w-36 xl:px-4">
                Status
              </TableHead>

              <TableHead className="w-12 px-1 text-right xl:w-14 xl:px-4">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {operations.map((operation) => (
              <TableRow key={operation.id}>
                <TableCell className="min-w-0 px-3 font-medium xl:px-4">
                  <Link
                    className={relationLinkClass + " block truncate"}
                    href={`/app/operations/${operation.id}`}
                    title={operation.name}
                  >
                    {operation.name}
                  </Link>

                  <div className="mt-2 space-y-1 font-normal text-xs leading-5 text-muted-foreground xl:hidden">
                    <p className="truncate">
                      <Link
                        className={relationLinkClass}
                        href={`/app/clients/${operation.contract.client.id}`}
                      >
                        {operation.contract.client.trade_name}
                      </Link>
                    </p>

                    <p className="truncate">
                      <Link
                        className={relationLinkClass}
                        href={`/app/contracts/${operation.contract.id}`}
                      >
                        {operation.contract.name}
                      </Link>
                    </p>

                    <p className="tabular-nums">
                      <OperationPeriod compact operation={operation} />
                    </p>
                  </div>
                </TableCell>

                <TableCell className="hidden max-w-56 xl:table-cell">
                  <Link
                    className={relationLinkClass}
                    href={`/app/clients/${operation.contract.client.id}`}
                  >
                    {operation.contract.client.trade_name}
                  </Link>
                </TableCell>

                <TableCell className="hidden max-w-56 xl:table-cell">
                  <Link
                    className={relationLinkClass + " block truncate"}
                    href={`/app/contracts/${operation.contract.id}`}
                    title={operation.contract.name}
                  >
                    {operation.contract.name}
                  </Link>
                </TableCell>

                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  <OperationPeriod operation={operation} />
                </TableCell>

                <TableCell className="px-2 xl:px-4">
                  <OperationStatusBadge status={operation.status} />
                </TableCell>

                <TableCell className="px-1 text-right xl:px-4">
                  <Button asChild size="icon" variant="ghost">
                    <Link
                      aria-label={`Ver detalhes da operação ${operation.name}`}
                      href={`/app/operations/${operation.id}`}
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
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
    </TableFrame>
  );
}