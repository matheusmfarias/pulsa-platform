"use client";

import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { ActiveFiltersSummary, ListFilterBar } from "@/components/layout/list";
import { Button } from "@/components/ui/button";
import { FilterSelect, type FilterSelectOption } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";

import { useListNavigation } from "./list-navigation";

const SEARCH_DEBOUNCE_MS = 350;

export function SearchStatusList({
  ariaLabel,
  children,
  filterLabel,
  filters,
  options,
  pathname,
  placeholder,
  queryLabel,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  filterLabel: string;
  filters: { query?: string | null; status?: string | null };
  options: FilterSelectOption<string>[];
  pathname: string;
  placeholder: string;
  queryLabel: string;
}) {
  const searchParams = useSearchParams();
  const { navigate } = useListNavigation();
  const appliedQuery = searchParams.get("q") ?? filters.query ?? "";
  const appliedStatus = searchParams.get("status") ?? filters.status ?? "all";
  const [queryDraft, setQueryDraft] = React.useState(appliedQuery);
  const [statusDraft, setStatusDraft] = React.useState(appliedStatus);
  const expectedSearchRef = React.useRef(searchParams.toString());

  React.useEffect(() => {
    const currentSearch = searchParams.toString();
    if (currentSearch === expectedSearchRef.current) return;

    expectedSearchRef.current = currentSearch;
    setQueryDraft(searchParams.get("q") ?? "");
    setStatusDraft(searchParams.get("status") ?? "all");
  }, [searchParams]);

  const navigateWithFilters = React.useCallback(
    (query: string, status: string) => {
      const params = new URLSearchParams();
      const normalizedQuery = query.trim();
      if (normalizedQuery) params.set("q", normalizedQuery);
      if (status !== "all") params.set("status", status);
      const nextSearch = params.toString();
      if (nextSearch === searchParams.toString()) return;

      expectedSearchRef.current = nextSearch;
      navigate(nextSearch ? `${pathname}?${nextSearch}` : pathname, "replace");
    },
    [navigate, pathname, searchParams],
  );

  React.useEffect(() => {
    if (queryDraft.trim() === appliedQuery) return;
    const timeout = window.setTimeout(() => navigateWithFilters(queryDraft, statusDraft), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [appliedQuery, navigateWithFilters, queryDraft, statusDraft]);

  const selectedStatus = options.find((option) => option.value === statusDraft);
  const hasActiveFilters = Boolean(queryDraft.trim()) || statusDraft !== "all";

  function clearFilters() {
    setQueryDraft("");
    setStatusDraft("all");
    navigateWithFilters("", "all");
  }

  return (
    <>
      <ListFilterBar
        aria-label={ariaLabel}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={queryLabel}
            className="bg-background pl-9"
            maxLength={120}
            name="q"
            onChange={(event) => setQueryDraft(event.target.value)}
            placeholder={placeholder}
            type="search"
            value={queryDraft}
          />
        </div>
        <FilterSelect
          ariaLabel={filterLabel}
          label="Status"
          onValueChange={(value) => {
            setStatusDraft(value);
            navigateWithFilters(queryDraft, value);
          }}
          options={options}
          value={statusDraft}
        />
        {hasActiveFilters ? (
          <div className="flex w-full min-w-0 items-center gap-2 border-t border-border-default pt-3">
            <ActiveFiltersSummary className="min-w-0 flex-1 border-0 pt-0">
              <span className="font-medium text-foreground">Filtros ativos:</span>{" "}
              {[
                queryDraft.trim() ? `Busca: ${queryDraft.trim()}` : null,
                statusDraft !== "all" ? `Status: ${selectedStatus?.label ?? statusDraft}` : null,
              ].filter(Boolean).join(" · ")}
            </ActiveFiltersSummary>
            <Button aria-label={`Limpar filtros de ${ariaLabel.replace(/^Filtros de\s+/i, "")}`} className="shrink-0" onClick={clearFilters} size="icon" type="button" variant="ghost">
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ) : null}
      </ListFilterBar>
      <div className="mt-5 sm:mt-6">{children}</div>
    </>
  );
}
