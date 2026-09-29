import { Search, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import {
  ActiveFiltersSummary,
  ListFilterActions,
  ListFilterBar,
} from "@/components/layout/list";

import {
  ASSIGNMENT_STATUS_LABELS,
  type AssignmentStatus,
} from "../domain/assignment";
import type { AssignmentListFilters } from "../schemas/assignment-schemas";

export function hasActiveAssignmentFilters(
  filters: AssignmentListFilters,
): boolean {
  return Boolean(filters.status || filters.query);
}

export function AssignmentFilterBar({
  filters,
}: {
  filters: AssignmentListFilters;
}) {
  const hasActiveFilters = hasActiveAssignmentFilters(filters);

  return (
    <ListFilterBar
      action="/app/assignments"
      aria-label="Filtros de alocações"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <div className="relative min-w-0 flex-1">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Buscar alocações por colaborador" className="bg-background pl-9" defaultValue={filters.query} name="q" placeholder="Buscar colaborador" type="search" />
      </div>
      <div className="min-w-0 sm:w-56">
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

      <ListFilterActions>
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
      </ListFilterActions>

      {hasActiveFilters ? (
        <ActiveFiltersSummary className="sm:basis-full">
          <span className="font-medium text-foreground">Filtros ativos:</span>{" "}
          {[filters.query ? `Colaborador: ${filters.query}` : null, filters.status ? `Status: ${ASSIGNMENT_STATUS_LABELS[filters.status as AssignmentStatus]}` : null].filter(Boolean).join(" · ")}
        </ActiveFiltersSummary>
      ) : null}
    </ListFilterBar>
  );
}
