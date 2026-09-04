import { Search, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import type { JobRoleListFilters } from "../schemas/job-role-schemas";

export function hasActiveJobRoleFilters(
  filters: JobRoleListFilters,
): boolean {
  return Boolean(filters.query) || filters.status !== "all";
}

export function JobRoleFilterBar({
  filters,
}: {
  filters: JobRoleListFilters;
}) {
  const hasActiveFilters = hasActiveJobRoleFilters(filters);

  return (
    <form
      action="/app/job-roles"
      aria-label="Filtros de cargos"
      className="mt-6 grid gap-3 rounded-surface border border-border-default bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
      method="get"
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
        />

        <Input
          aria-label="Buscar cargos por nome"
          className="pl-9"
          defaultValue={filters.query}
          name="q"
          placeholder="Buscar por nome"
        />
      </div>

      <Select
        aria-label="Filtrar cargos por status"
        defaultValue={filters.status}
        name="status"
      >
        <option value="all">Todos os status</option>
        <option value="active">Ativos</option>
        <option value="inactive">Inativos</option>
      </Select>

      <div className="flex items-center gap-2">
        <Button
          className="flex-1 sm:flex-none"
          type="submit"
          variant="outline"
        >
          Aplicar filtros
        </Button>

        {hasActiveFilters ? (
          <Button asChild size="icon" variant="ghost">
            <Link
              aria-label="Limpar filtros de cargos"
              href="/app/job-roles"
            >
              <X aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <p className="border-t border-border-default pt-3 text-xs leading-5 text-muted-foreground sm:col-span-3">
          <span className="font-medium text-foreground">
            Filtros ativos:
          </span>{" "}
          {filters.query ? (
            <>Busca por “{filters.query}”</>
          ) : null}

          {filters.query && filters.status !== "all"
            ? " · "
            : null}

          {filters.status !== "all"
            ? `Status: ${
                filters.status === "active"
                  ? "Ativo"
                  : "Inativo"
              }`
            : null}
        </p>
      ) : null}
    </form>
  );
}