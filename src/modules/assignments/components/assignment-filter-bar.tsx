import { X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

import {
  ASSIGNMENT_STATUS_LABELS,
  type AssignmentStatus,
} from "../domain/assignment";
import type { AssignmentListFilters } from "../schemas/assignment-schemas";

export function hasActiveAssignmentFilters(
  filters: AssignmentListFilters,
): boolean {
  return Boolean(filters.status);
}

export function AssignmentFilterBar({
  filters,
}: {
  filters: AssignmentListFilters;
}) {
  const hasActiveFilters = hasActiveAssignmentFilters(filters);

  return (
    <form
      action="/app/assignments"
      aria-label="Filtros de alocações"
      className="mt-6 flex flex-col gap-3 rounded-surface border border-border-default bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-end"
      method="get"
    >
      <div className="min-w-0 flex-1 sm:max-w-xs">
        <Select
          aria-label="Filtrar alocações por status"
          defaultValue={filters.status ?? "all"}
          name="status"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="active">Ativas</option>
          <option value="suspended">Suspensas</option>
          <option value="finished">Finalizadas</option>
          <option value="cancelled">Canceladas</option>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1 sm:flex-none" type="submit" variant="outline">
          Aplicar filtro
        </Button>

        {hasActiveFilters ? (
          <Button asChild size="icon" variant="ghost">
            <Link
              aria-label="Limpar filtros de alocações"
              href="/app/assignments"
            >
              <X aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      {filters.status ? (
        <p className="border-t border-border-default pt-3 text-xs leading-5 text-muted-foreground sm:basis-full">
          <span className="font-medium text-foreground">Filtro ativo:</span>{" "}
          Status:{" "}
          {ASSIGNMENT_STATUS_LABELS[
            filters.status as AssignmentStatus
          ]}
        </p>
      ) : null}
    </form>
  );
}