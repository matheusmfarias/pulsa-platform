import { Search, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import type { ClientListFilters } from "../schemas/client-schemas";

import {
  ActiveFiltersSummary,
  ListFilterActions,
  ListFilterBar,
} from "@/components/layout/list";

export function hasActiveClientFilters(filters: ClientListFilters): boolean {
  return Boolean(filters.query) || filters.status !== "all";
}

export function ClientFilterBar({ filters }: { filters: ClientListFilters }) {
  const hasActiveFilters = hasActiveClientFilters(filters);

  return (
    <ListFilterBar
      action="/app/clients"
      aria-label="Filtros de clientes"
      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
        />

        <Input
          aria-label="Buscar clientes por nome"
          className="pl-9"
          defaultValue={filters.query}
          name="q"
          placeholder="Buscar por nome"
        />
      </div>

      <Select
        aria-label="Filtrar clientes por status"
        defaultValue={filters.status}
        name="status"
      >
        <option value="all">Todos os status</option>
        <option value="active">Ativos</option>
        <option value="inactive">Inativos</option>
      </Select>

      <ListFilterActions>
        <Button className="flex-1 sm:flex-none" type="submit" variant="outline">
          Aplicar filtros
        </Button>

        {hasActiveFilters ? (
          <Button asChild size="icon" variant="ghost">
            <Link aria-label="Limpar filtros de clientes" href="/app/clients">
              <X aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : null}
      </ListFilterActions>

      {hasActiveFilters ? (
        <ActiveFiltersSummary className="sm:col-span-3">
          <span className="font-medium text-foreground">Filtros ativos:</span>{" "}
          {filters.query ? <>Busca por “{filters.query}”</> : null}
          {filters.query && filters.status !== "all" ? " · " : null}
          {filters.status !== "all"
            ? `Status: ${filters.status === "active" ? "Ativo" : "Inativo"}`
            : null}
        </ActiveFiltersSummary>
      ) : null}
    </ListFilterBar>
  );
}
