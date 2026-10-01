import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
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

import type { AssignmentListItem } from "../domain/assignment";
import { AssignmentStatusBadge } from "./assignment-status-badge";

const relationLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function formatDate(value: string | null): string {
  if (!value) return "Em aberto";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}

function MobileAssignmentCard({ assignment }: { assignment: AssignmentListItem }) {
  const href = `/app/assignments/${assignment.id}`;

  return (
    <li>
      <article className="rounded-surface border border-border-default/80 bg-surface p-4">
        <header className="flex items-start justify-between gap-3">
          <Link
            className="min-w-0 break-words rounded-sm text-base font-semibold leading-6 text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            href={href}
          >
            {assignment.worker.full_name}
          </Link>
          <AssignmentStatusBadge status={assignment.status} />
        </header>

        <dl className="mt-3 space-y-2 border-t border-border-default/70 pt-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Posto</dt>
            <dd className="mt-0.5 break-words">
              <Link className={relationLinkClass} href={`/app/positions/${assignment.position.id}`}>
                {assignment.position.job_role.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Unidade</dt>
            <dd className="mt-0.5 break-words">
              <Link className={relationLinkClass} href={`/app/units/${assignment.position.unit.id}`}>
                {assignment.position.unit.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Período</dt>
            <dd className="mt-0.5 tabular-nums">
              {formatDate(assignment.start_date)} — {formatDate(assignment.end_date)}
            </dd>
          </div>
        </dl>

        <div className="mt-3 border-t border-border-default/70 pt-3">
          <Button asChild className="h-11 w-full sm:h-9 sm:w-auto" size="sm" variant="outline">
            <Link href={href}>Ver alocação <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        </div>
      </article>
    </li>
  );
}

export function AssignmentTable({
  assignments,
  footer,
}: {
  assignments: AssignmentListItem[];
  footer?: ReactNode;
}) {
  return (
    <>
      <ul aria-label="Lista de alocações" className="mt-4 grid gap-3 xl:hidden">
        {assignments.map((assignment) => (
         <MobileAssignmentCard assignment={assignment} key={assignment.id} />
        ))}
      </ul>
      <TableFrame className="mt-4 hidden xl:block">
      <TableScrollArea label="Tabela de alocações" shadow>
        <Table className="min-w-full table-fixed">
          <colgroup>
            <col className="w-[21%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
            <col className="w-[13%]" />
            <col className="w-[8%]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">
                <span className="xl:hidden">Alocação</span>
                <span className="hidden xl:inline">Colaborador</span>
              </TableHead>

              <TableHead className="hidden xl:table-cell">Posto</TableHead>

              <TableHead className="hidden xl:table-cell">Unidade</TableHead>

              <TableHead className="hidden xl:table-cell">Período</TableHead>

              <TableHead className="px-3">
                Status
              </TableHead>

              <TableHead className="px-2 text-right">
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
                          href={`/app/positions/${assignment.position.id}`}
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
                      href={`/app/positions/${assignment.position.id}`}
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

                  <TableCell className="px-3">
                    <AssignmentStatusBadge status={assignment.status} />
                  </TableCell>

                  <TableCell className="px-2 text-right">
                    <Button asChild size="icon" variant="ghost">
                      <Link
                        aria-label={`Ver alocação de ${assignment.worker.full_name}`}
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
      {footer ? (
        <div className="mt-3 overflow-hidden rounded-card bg-surface shadow-card [&>nav]:border-t-0">
          {footer}
        </div>
      ) : null}
    </>
  );
}

function SkeletonBone({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-control bg-subtle motion-reduce:animate-none ${className}`}
    />
  );
}

export function AssignmentTableSkeleton() {
  return (
    <TableFrame
      aria-busy="true"
      aria-label="Carregando resultados de alocações"
      className="mt-4 overflow-hidden rounded-card bg-surface shadow-card"
      role="status"
    >
      <TableScrollArea label="Resultados de alocações" shadow>
        <Table className="min-w-full table-fixed xl:min-w-[920px] xl:table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 xl:px-4">Alocação</TableHead>
              <TableHead className="hidden xl:table-cell">Posto</TableHead>
              <TableHead className="hidden xl:table-cell">Unidade</TableHead>
              <TableHead className="hidden xl:table-cell">Período</TableHead>
              <TableHead className="w-28 px-2 xl:w-32 xl:px-4">Status</TableHead>
              <TableHead className="w-12 px-1 xl:w-14 xl:px-4"><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }, (_, index) => (
              <TableRow key={index}>
                <TableCell className="px-3 xl:px-4">
                  <SkeletonBone className="h-4 w-3/4" />
                  <div className="mt-2 space-y-1.5 xl:hidden">
                    <SkeletonBone className="h-3 w-2/3" />
                    <SkeletonBone className="h-3 w-1/2" />
                    <SkeletonBone className="h-3 w-2/5" />
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell"><SkeletonBone className="h-4 w-3/4" /></TableCell>
                <TableCell className="hidden xl:table-cell"><SkeletonBone className="h-4 w-4/5" /></TableCell>
                <TableCell className="hidden xl:table-cell"><SkeletonBone className="h-4 w-2/3" /></TableCell>
                <TableCell className="px-2"><SkeletonBone className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell className="px-1"><SkeletonBone className="ml-auto size-8 rounded-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
      <div aria-hidden="true" className="flex items-center justify-between border-t border-border-default/80 px-4 py-3">
        <SkeletonBone className="h-4 w-24" />
        <div className="flex gap-2"><SkeletonBone className="h-9 w-20" /><SkeletonBone className="h-9 w-20" /></div>
      </div>
    </TableFrame>
  );
}
