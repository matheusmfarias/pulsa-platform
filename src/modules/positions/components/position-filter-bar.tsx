import { Search, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import { POSITION_STATUS_LABELS } from "../domain/position";
import type { PositionGlobalListFilters } from "../schemas/position-schemas";

export function hasActivePositionFilters(
  filters: PositionGlobalListFilters,
): boolean {
  return Boolean(filters.query) || Boolean(filters.status);
}

export function PositionFilterBar({
  filters,
}: {
  filters: PositionGlobalListFilters;
}) {
  const hasActiveFilters = hasActivePositionFilters(filters);

  return (
    <form
      action="/app/positions"
      aria-label="Filtros de postos"
      className="mt-6 grid gap-3 rounded-surface border border-border-default bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
      method="get"
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
        />

        <Input
          aria-label="Buscar postos por cargo"
          className="pl-9"
          defaultValue={filters.query ?? ""}
          name="q"
          placeholder="Buscar por cargo"
        />
      </div>

      <Select
        aria-label="Filtrar postos por status"
        defaultValue={filters.status ?? "all"}
        name="status"
      >
        <option value="all">Todos os status</option>
        <option value="active">Ativos</option>
        <option value="inactive">Inativos</option>
      </Select>

      <div className="flex gap-2">
        <Button className="flex-1 sm:flex-none" type="submit" variant="outline">
          Aplicar filtros
        </Button>

        {hasActiveFilters ? (
          <Button asChild size="icon" variant="ghost">
            <Link aria-label="Limpar filtros de postos" href="/app/positions">
              <X aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <p className="border-t border-border-default pt-3 text-xs leading-5 text-muted-foreground sm:col-span-3">
          <span className="font-medium text-foreground">Filtros ativos:</span>{" "}
          {filters.query ? <>Busca por “{filters.query}”</> : null}
          {filters.query && filters.status ? " · " : null}
          {filters.status
            ? "Status: " + POSITION_STATUS_LABELS[filters.status]
            : null}
        </p>
      ) : null}
    </form>
  );
}