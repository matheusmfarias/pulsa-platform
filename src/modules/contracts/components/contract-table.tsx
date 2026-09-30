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

import type { ContractWithClient } from "../domain/contract";
import { ContractStatusBadge } from "./contract-status-badge";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function formatDate(value: string | null): string {
  if (!value) return "Em aberto";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}

function MobileContractCard({ contract }: { contract: ContractWithClient }) {
  const href = `/app/contracts/${contract.id}`;

  return (
    <li>
      <article className="rounded-surface border border-border-default/80 bg-surface p-4">
        <header className="flex items-start justify-between gap-3">
          <Link
            className="min-w-0 break-words rounded-sm text-base font-semibold leading-6 text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            href={href}
          >
            {contract.name}
          </Link>
          <ContractStatusBadge status={contract.status} />
        </header>
        <dl className="mt-3 space-y-2 border-t border-border-default/70 pt-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Cliente</dt>
            <dd className="mt-0.5 break-words">
              <Link className={relationLinkClass} href={`/app/clients/${contract.client.id}`}>
                {contract.client.trade_name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Período</dt>
            <dd className="mt-0.5 tabular-nums">
              {formatDate(contract.start_date)} — {formatDate(contract.end_date)}
            </dd>
          </div>
        </dl>
        <div className="mt-3 border-t border-border-default/70 pt-3">
          <Button asChild className="h-11 w-full sm:h-9 sm:w-auto" size="sm" variant="outline">
            <Link href={href}>Ver contrato <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        </div>
      </article>
    </li>
  );
}

export function ContractTable({
  contracts,
}: {
  contracts: ContractWithClient[];
}) {
  return (
    <>
      <ul aria-label="Lista de contratos" className="mt-4 grid gap-3 xl:hidden">
        {contracts.map((contract) => (
         <MobileContractCard contract={contract} key={contract.id} />
        ))}
      </ul>
      <TableFrame className="mt-4 hidden xl:block">
      <TableScrollArea bounded label="Tabela de contratos">
        <Table className="min-w-full table-fixed xl:min-w-[760px] xl:table-auto">
          <TableHeader className="lg:sticky lg:top-0 lg:z-10">
            <TableRow>
              <TableHead className="px-3 xl:px-4">
                <span className="xl:hidden">Contrato</span>
                <span className="hidden xl:inline">Nome</span>
              </TableHead>

              <TableHead className="hidden xl:table-cell">
                Cliente
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
            {contracts.map((contract) => {
              const href = `/app/contracts/${contract.id}`;

              return (
                <TableRow key={contract.id}>
                  <TableCell className="min-w-0 px-3 font-medium xl:px-4">
                    <Link
                      className={relationLinkClass + " block truncate"}
                      href={href}
                      title={contract.name}
                    >
                      {contract.name}
                    </Link>

                    <div className="mt-2 space-y-1 font-normal text-xs leading-5 text-muted-foreground xl:hidden">
                      <p className="truncate">
                        <Link
                          className={relationLinkClass}
                          href={`/app/clients/${contract.client.id}`}
                        >
                          {contract.client.trade_name}
                        </Link>
                      </p>

                      <p className="tabular-nums">
                        {formatDate(contract.start_date)} —{" "}
                        {formatDate(contract.end_date)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell">
                    <Link
                      className={relationLinkClass}
                      href={`/app/clients/${contract.client.id}`}
                    >
                      {contract.client.trade_name}
                    </Link>
                  </TableCell>

                  <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground xl:table-cell">
                    {formatDate(contract.start_date)} —{" "}
                    {formatDate(contract.end_date)}
                  </TableCell>

                  <TableCell className="px-2 xl:px-4">
                    <ContractStatusBadge status={contract.status} />
                  </TableCell>

                  <TableCell className="px-1 text-right xl:px-4">
                    <Button asChild size="icon" variant="ghost">
                      <Link
                        aria-label={`Ver detalhes do contrato ${contract.name}`}
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
    </>
  );
}
