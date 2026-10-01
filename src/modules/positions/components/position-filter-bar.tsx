import { SearchStatusList } from "@/components/layout/search-status-list";
import type { FilterSelectOption } from "@/components/ui/filter-select";

import { POSITION_STATUS_LABELS } from "../domain/position";
import type { PositionGlobalListFilters } from "../schemas/position-schemas";

const STATUS_OPTIONS: FilterSelectOption<string>[] = [
  { label: "Todos os status", value: "all" },
  { label: POSITION_STATUS_LABELS.active, value: "active" },
  { label: POSITION_STATUS_LABELS.inactive, value: "inactive" },
];

export function hasActivePositionFilters(filters: PositionGlobalListFilters): boolean {
  return Boolean(filters.query) || Boolean(filters.status);
}

export function PositionFilterBar({
  children,
  filters,
}: {
  children: React.ReactNode;
  filters: PositionGlobalListFilters;
}) {
  return (
    <SearchStatusList
      ariaLabel="Filtros de postos"
      filterLabel="Filtrar postos por status"
      filters={{ ...filters, status: filters.status ?? "all" }}
      options={STATUS_OPTIONS}
      pathname="/app/positions"
      placeholder="Buscar por cargo"
      queryLabel="Buscar postos por cargo"
    >
      {children}
    </SearchStatusList>
  );
}
