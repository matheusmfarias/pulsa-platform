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

import type { Client } from "../domain/client";
import { formatDocumentNumber } from "../domain/document-number";
import { ClientStatusBadge } from "./client-status-badge";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

export function ClientTable({
  clients,
}: {
  clients: Client[];
}) {
  return (
    <TableFrame className="mt-4">
      <TableScrollArea label="Tabela de clientes">
        <Table className="min-w-full table-fixed xl:min-w-[760px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">
                <span className="xl:hidden">Cliente</span>
                <span className="hidden xl:inline">Nome fantasia</span>
              </TableHead>

              <TableHead className="hidden xl:table-cell">
                Razão social
              </TableHead>

              <TableHead className="hidden xl:table-cell">
                CNPJ
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
            {clients.map((client) => {
              const href = `/app/clients/${client.id}`;

              return (
                <TableRow key={client.id}>
                  <TableCell className="min-w-0 px-3 font-medium xl:px-4">
                    <Link
                      className={relationLinkClass + " block truncate"}
                      href={href}
                      title={client.trade_name}
                    >
                      {client.trade_name}
                    </Link>

                    <div className="mt-2 space-y-1 font-normal text-xs leading-5 text-muted-foreground xl:hidden">
                      <p className="truncate">
                        {client.legal_name}
                      </p>

                      <p className="tabular-nums">
                        {formatDocumentNumber(client.document_number)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="hidden max-w-80 text-muted-foreground xl:table-cell">
                    <span
                      className="block truncate"
                      title={client.legal_name}
                    >
                      {client.legal_name}
                    </span>
                  </TableCell>

                  <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground xl:table-cell">
                    {formatDocumentNumber(client.document_number)}
                  </TableCell>

                  <TableCell className="px-2 xl:px-4">
                    <ClientStatusBadge status={client.status} />
                  </TableCell>

                  <TableCell className="px-1 text-right xl:px-4">
                    <Button asChild size="icon" variant="ghost">
                      <Link
                        aria-label={`Ver detalhes do cliente ${client.trade_name}`}
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