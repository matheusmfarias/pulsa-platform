import { SearchStatusList } from "@/components/layout/search-status-list";
import type { FilterSelectOption } from "@/components/ui/filter-select";

import type { ClientListFilters } from "../schemas/client-schemas";

const STATUS_OPTIONS: FilterSelectOption<string>[] = [
  { label: "Todos os status", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Inativos", value: "inactive" },
];

export function hasActiveClientFilters(filters: ClientListFilters): boolean {
  return Boolean(filters.query) || filters.status !== "all";
}

export function ClientFilterBar({
  children,
  filters,
}: {
  children: React.ReactNode;
  filters: ClientListFilters;
}) {
  return (
    <SearchStatusList
      ariaLabel="Filtros de clientes"
      filterLabel="Filtrar clientes por status"
      filters={filters}
      options={STATUS_OPTIONS}
      pathname="/app/clients"
      placeholder="Buscar por nome"
      queryLabel="Buscar clientes por nome"
    >
      {children}
    </SearchStatusList>
  );
}
