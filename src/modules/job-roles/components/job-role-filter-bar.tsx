import { SearchStatusList } from "@/components/layout/search-status-list";
import type { FilterSelectOption } from "@/components/ui/filter-select";

import type { JobRoleListFilters } from "../schemas/job-role-schemas";

const STATUS_OPTIONS: FilterSelectOption<string>[] = [
  { label: "Todos os status", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Inativos", value: "inactive" },
];

export function hasActiveJobRoleFilters(filters: JobRoleListFilters): boolean {
  return Boolean(filters.query) || filters.status !== "all";
}

export function JobRoleFilterBar({
  children,
  filters,
}: {
  children: React.ReactNode;
  filters: JobRoleListFilters;
}) {
  return (
    <SearchStatusList
      ariaLabel="Filtros de cargos"
      filterLabel="Filtrar cargos por status"
      filters={filters}
      options={STATUS_OPTIONS}
      pathname="/app/job-roles"
      placeholder="Buscar por nome"
      queryLabel="Buscar cargos por nome"
    >
      {children}
    </SearchStatusList>
  );
}
