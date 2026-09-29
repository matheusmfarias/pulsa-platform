"use client";

import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { ActiveFiltersSummary, ListFilterBar } from "@/components/layout/list";
import { Button } from "@/components/ui/button";
import { FilterSelect, type FilterSelectOption } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";

import {
  ASSIGNMENT_STATUS_LABELS,
  type AssignmentStatus,
} from "../domain/assignment";
import type { AssignmentListFilters } from "../schemas/assignment-schemas";
import { useAssignmentListNavigation } from "./assignment-list-navigation";

type AssignmentStatusFilter = AssignmentStatus | "all";

const SEARCH_DEBOUNCE_MS = 350;
const STATUS_OPTIONS: FilterSelectOption<AssignmentStatusFilter>[] = [
  { label: "Todos os status", value: "all" },
  { label: ASSIGNMENT_STATUS_LABELS.pending, value: "pending" },
  { label: ASSIGNMENT_STATUS_LABELS.active, value: "active" },
  { label: ASSIGNMENT_STATUS_LABELS.suspended, value: "suspended" },
  { label: ASSIGNMENT_STATUS_LABELS.finished, value: "finished" },
  { label: ASSIGNMENT_STATUS_LABELS.cancelled, value: "cancelled" },
];
const STATUS_VALUES = new Set<AssignmentStatusFilter>(
  STATUS_OPTIONS.map((option) => option.value),
);

function readStatus(value: string | null): AssignmentStatusFilter {
  return value && STATUS_VALUES.has(value as AssignmentStatusFilter)
    ? (value as AssignmentStatusFilter)
    : "all";
}

export function AssignmentFilterBar({
  filters,
}: {
  filters: AssignmentListFilters;
}) {
  const searchParams = useSearchParams();
  const { navigate } = useAssignmentListNavigation();
  const appliedQuery = searchParams.get("q") ?? filters.query;
  const appliedStatus = readStatus(searchParams.get("status") ?? filters.status ?? null);
  const [queryDraft, setQueryDraft] = React.useState(appliedQuery);
  const [status, setStatus] = React.useState<AssignmentStatusFilter>(appliedStatus);
  const expectedSearchRef = React.useRef(searchParams.toString());

  React.useEffect(() => {
    const currentSearch = searchParams.toString();
    if (currentSearch === expectedSearchRef.current) return;

    expectedSearchRef.current = currentSearch;
    setQueryDraft(searchParams.get("q") ?? "");
    setStatus(readStatus(searchParams.get("status")));
  }, [searchParams]);

  const navigateWithFilters = React.useCallback(
    (query: string, nextStatus: AssignmentStatusFilter) => {
      const params = new URLSearchParams();
      const normalizedQuery = query.trim();
      if (normalizedQuery) params.set("q", normalizedQuery);
      if (nextStatus !== "all") params.set("status", nextStatus);
      const pageSize = searchParams.get("size");
      if (pageSize && pageSize !== "10") params.set("size", pageSize);

      const nextSearch = params.toString();
      if (nextSearch === searchParams.toString()) return;

      expectedSearchRef.current = nextSearch;
      navigate(nextSearch ? `/app/assignments?${nextSearch}` : "/app/assignments", "replace");
    },
    [navigate, searchParams],
  );

  React.useEffect(() => {
    if (queryDraft.trim() === appliedQuery) return;

    const timeout = window.setTimeout(() => {
      navigateWithFilters(queryDraft, status);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [appliedQuery, navigateWithFilters, queryDraft, status]);

  const hasActiveFilters = Boolean(queryDraft.trim()) || status !== "all";

  function clearFilters() {
    setQueryDraft("");
    setStatus("all");
    navigateWithFilters("", "all");
  }

  return (
    <ListFilterBar
      aria-label="Filtros de alocações"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Buscar alocações por colaborador"
          className="bg-background pl-9"
          maxLength={120}
          name="q"
          onChange={(event) => setQueryDraft(event.target.value)}
          placeholder="Buscar colaborador"
          type="search"
          value={queryDraft}
        />
      </div>

      <FilterSelect
        ariaLabel="Filtrar alocações por status"
        label="Status"
        onValueChange={(nextStatus) => {
          setStatus(nextStatus);
          navigateWithFilters(queryDraft, nextStatus);
        }}
        options={STATUS_OPTIONS}
        value={status}
      />

      {hasActiveFilters ? (
        <div className="flex w-full min-w-0 items-center gap-2 border-t border-border-default pt-3">
          <ActiveFiltersSummary className="min-w-0 flex-1 border-0 pt-0">
            <span className="font-medium text-foreground">Filtros ativos:</span>{" "}
            {[
              queryDraft.trim() ? `Colaborador: ${queryDraft.trim()}` : null,
              status !== "all" ? `Status: ${ASSIGNMENT_STATUS_LABELS[status]}` : null,
            ].filter(Boolean).join(" · ")}
          </ActiveFiltersSummary>
          <Button
            aria-label="Limpar filtros de alocações"
            className="shrink-0"
            onClick={clearFilters}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : null}
    </ListFilterBar>
  );
}
